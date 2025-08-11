import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, View, Image, Pressable, StyleSheet, Dimensions, Text, ActivityIndicator, Button } from "react-native";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebaseConfig"; 
import { useNavigation } from "@react-navigation/native"; // Import useNavigation


const { width, height } = Dimensions.get("window");

type Submission = {
    id: string,
    caption: string;
    dare: string;
    media_url: string;
    submitted_at: string;
  }


export default function StoryViewer({ 
  battleId, 
  onViewSubmissions,
  dare,
} : { 
  battleId: string,
  onViewSubmissions: (bool:boolean) => void
  dare: string
}) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [index, setIndex] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation();

  useEffect(() => {
      fetchSubmissions();
      // setShowSubmissions(true);
      setLoading(false);
  }, [battleId]);
    
    
  const fetchSubmissions = async () => {
      const submissionRef = collection(db, 'games', battleId, 'submissions');
      const q = query(submissionRef, orderBy("submitted_at", "desc"));
      const snapshot = await getDocs(q);

      const submissionsData: Submission[] = [];
      snapshot.forEach(doc => {
          const data = doc.data();
          submissionsData.push({
          id: doc.id,
          caption: data.caption,
          dare: data.dare,
          media_url: data.media_url,
          submitted_at: data.submitted_at.toDate().toISOString()
          })
      });

      setSubmissions(submissionsData);
  }

  const nextStory = () => {
      setIndex((prev) => (prev + 1) % submissions.length);
    };
  
    const prevStory = () => {
      setIndex((prev) => (prev - 1 + submissions.length) % submissions.length);
    };
  
  const resetTimer = () => {
    if (timerRef.current === null) return;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current); 
    }
    timerRef.current = window.setTimeout(nextStory, 3000); // Use window.setTimeout to ensure correct typing
  };

  useEffect(() => {
      resetTimer();
      return () => {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current); 
        }
      };
    }, [index]);

    
  const handlePress = (evt : any) => {
    const tapX = evt.nativeEvent.locationX;
    if (tapX < width / 2) {
      prevStory();
    } else {
      nextStory();
    }
  };
    

  return (
    <SafeAreaView>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#fff"
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        />
      ) : (
        <View style={styles.container}>
          {dare !== "Waiting for dare" ? (
            <Button title="x" onPress={() => onViewSubmissions(false)} />
          ) : (
            <Button title="Back" onPress={() => navigation.goBack()} />
          )}
          <Pressable style={styles.pressable} onPress={handlePress}>
            {submissions.length > 0 ? (
              <>
                <Image
                  source={{ uri: submissions[index].media_url }}
                  style={styles.image}
                />
                <Text>Caption: {submissions[index].caption}</Text>
                <Text>Dare: {submissions[index].dare}</Text>
                <Text>
                  Submitted at:{" "}
                  {new Date(submissions[index].submitted_at).toLocaleString()}
                </Text>
              </>
            ) : (
              <Text style={{ color: "#fff" }}>No submissions available</Text>
            )}
          </Pressable>
          <View style={styles.progressBarContainer}>
            {submissions.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressBar,
                  i === index && styles.activeProgressBar,
                ]}
              />
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  pressable: {
    flex: 1,
  },
  image: {
    width,
    height,
    resizeMode: "cover",
  },
  progressBarContainer: {
    position: "absolute",
    top: 40,
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 10,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 2,
    borderRadius: 2,
  },
  activeProgressBar: {
    backgroundColor: "#fff",
  },
});