import React, { useState, useEffect, useRef, useCallback } from "react";
import { SafeAreaView, View, Image, Button, StyleSheet, Dimensions, Text, ActivityIndicator, TouchableOpacity, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebaseConfig"; 
import { Video } from "expo-av";
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

type Submission = {
    id: string;
    user_id: string;
    caption: string;
    dare: string;
    media: Media[];
    submitted_at: string;
  }

type Media = {
  type: string;
  uri: string;
  // muted: boolean;
}


export default function PostView({ 
  battleId, 
  onViewSubmissions,
  dare,
} : { 
  battleId: string,
  onViewSubmissions: (bool:boolean) => void
  dare: string,
}) {
  const navigation = useNavigation();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useFocusEffect(
  useCallback(() => {
    fetchSubmissions();
    setLoading(false);
  }, [battleId])
);

useEffect(() => {
  console.log("Submissions fetched:", submissions);
}, [submissions]);

  const fetchSubmissions = async () => {
        const submissionRef = collection(db, 'games', battleId, 'submissions');
        const q = query(submissionRef, orderBy("submitted_at", "desc"));
        const snapshot = await getDocs(q);
  
        const submissionsData: Submission[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            submissionsData.push({
            id: doc.id,
            user_id: data.user_id,
            caption: data.caption,
            dare: data.dare,
            media: data.media,
            submitted_at: data.submitted_at.toDate().toISOString()
            })
        });
  
        setSubmissions(submissionsData);
    }

    const [horizontalIndex, setHorizontalIndex] = useState(0);
    const [verticalIndex, setVerticalIndex] = useState(0);
    
    const onHorizontalItemsChanged = useRef(({ viewableItems } : { viewableItems: any}) => {
      if (viewableItems.length > 0) {
        setHorizontalIndex(viewableItems[0].index); // first visible item
      }
    }).current;
        
    const onVerticalItemsChanged = useRef(({ viewableItems } : { viewableItems: any}) => {
      if (viewableItems.length > 0) {
        setVerticalIndex(viewableItems[0].index); // first visible item
      }
    }).current;

    const viewabilityConfig = {
      itemVisiblePercentThreshold: 75, // Trigger when 50% of the item is visible
    };
    

  return (
    <SafeAreaView>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={submissions}
          pagingEnabled
          onViewableItemsChanged={onVerticalItemsChanged}
          viewabilityConfig={viewabilityConfig}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index: vIndex }) => (
            <View style={{marginBottom: 20, height: height - 150}}>
              <FlatList
              data={item.media}
              horizontal
              pagingEnabled
              onViewableItemsChanged={onHorizontalItemsChanged}
              viewabilityConfig={viewabilityConfig}
              keyExtractor={(m, i) => i.toString()}
              renderItem={({ item: media, index: hIndex }) => (
              //   <TouchableOpacity
              //   activeOpacity={0.9}
              //   onPress={() => toggleMute(item.id, index)}
              // >
                <View>
                {media.type === 'video' ? (
                  <View style={{ width: width, height: width, overflow: 'hidden', }}>
                    <Video
                    source={{ uri: media.uri }}
                    style={{ width: width, height: width + 150,   position: 'absolute', 
                      top: -30, }}
                    shouldPlay={hIndex === horizontalIndex && vIndex === verticalIndex}
                    isLooping
                    isMuted={hIndex !== horizontalIndex && vIndex !== verticalIndex}
                  />
                </View>
                ) : (
                  <Image
                    source={{ uri: media.uri }}
                    style={{ width: width, height: width }}
                  />
                )}
                </View>
                // </TouchableOpacity>
              )}
              />
              <Text>{item.caption}</Text>
            </View>
          )}/>
      )}
    </SafeAreaView>
  )
};
