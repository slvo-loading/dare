import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, View, Image, Pressable, StyleSheet, Dimensions, Text, ActivityIndicator, Button } from "react-native";
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
  submissions,
} : { 
  battleId: string,
  onViewSubmissions: (bool:boolean) => void
  dare: string,
  submissions: Submission[]
}) {
  const [index, setIndex] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigation = useNavigation();

  const nextStory = () => {
      setIndex((prev) => (prev + 1) % submissions.length);
    };
  
  const prevStory = () => {
    setIndex((prev) => (prev - 1 + submissions.length) % submissions.length);
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(nextStory, 3000); // no window. needed in RN
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) {
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
      { submissions.length > 0 ? (
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
                  source={{ uri: submissions[index]?.media_url }}
                  style={styles.image}
                />
                <Text>Caption: {submissions[index]?.caption}</Text>
                <Text>Dare: {submissions[index]?.dare}</Text>
                <Text>
                  Submitted at:{" "}
                  {new Date(submissions[index]?.submitted_at).toLocaleString()}
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
      ) : (
        <Text>No Submissions</Text>
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