import { SafeAreaView, View, Text, Button, TextInput, ScrollView } from "react-native";
import { BattleStackProps } from "../../types";
import { useRoute, RouteProp } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { addDoc, collection, serverTimestamp, doc, updateDoc, arrayRemove, arrayUnion, getDoc } from "firebase/firestore";
import { db, storage } from "../../../firebaseConfig";
import { Image } from "expo-image";
// import { useVideoPlayer, VideoView } from 'expo-video';
import { Video } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

type SubmitRouteParams = {
  uri: NewSubmission[];
  battleId: string;
  dare: string;
  gameMode: string;
  caption: string | null;
  draft: boolean;
};

type SubmitRouteProp = RouteProp<
  { SubmitScreen: SubmitRouteParams },
  'SubmitScreen'
>;

type NewSubmission = {
  type: string;
  uri: string;
}

export default function SubmitScreen({ navigation }: BattleStackProps<'SubmitScreen'>) {
  const route = useRoute<SubmitRouteProp>();
  const { uri, battleId, dare, gameMode, draft} = route.params;
  const [caption, setCaption] = useState<string>(route.params.caption || '');
  const [newDare, setNewDare] = useState<string>('');
  const [media, setMedia] = useState<NewSubmission[]>(uri);
  const { user } = useAuth();


  const handleSubmit = async () => {
    if (!user || !uri || !battleId) {
      console.error("Missing submission data.")
      return;
    }

    const battleRef = doc(db, "games", battleId);
    const submissionsRef = collection(battleRef, "submissions");
    const updatedMedia = await uploadAllMedia();
    console.log("Updated media:", updatedMedia);

    const submissionData = {
      user_id: user.uid, 
      media: updatedMedia, 
      dare: dare,
      submitted_at: serverTimestamp(),
      caption: caption,
    }

    console.log("Submitting data:", submissionData);

    await addDoc(submissionsRef, submissionData);

    const battleSnap = await getDoc(battleRef);
    const battleData = battleSnap.data();
    const player1 = user.uid === battleData?.player1_id;
    console.log("Player 1:", player1);
    await updateDoc(battleRef, {
      [`${player1 ? "player1_last_submission" : "player2_last_submission"}`]: serverTimestamp()
    });
    console.log("updated last_submission");

    try {
      if (gameMode === 'survival') {
        await updateDoc(battleRef, {
          [`${player1 ? "player2_dare" : "player1_dare"}`]: arrayRemove(dare),
          [`${player1 ? "player1_dare" : "player2_dare"}`]: arrayUnion(newDare)
        });
      }

      setNewDare('');
      setCaption('');
      navigation.reset({
        index: 0,
        routes: [{ name: "BattleScreen" }],
      });

    } catch (error) {
      console.error("Error submitting data:", error);
    }
  }

  async function uploadAllMedia() {
    if (!user) return;
    const uploadedMedia = await Promise.all(
      media.map(async (item, index) => {
        // Convert URI to Blob
        const response = await fetch(item.uri);
        const blob = await response.blob();
  
        // Create a storage ref with unique name
        const storageRef = ref(storage, `media/${Date.now()}_${index}`);
  
        // Upload Blob
        await uploadBytes(storageRef, blob);
  
        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
  
        // Return updated media object with new URL
        return {
          type: item.type,
          uri: downloadURL,
        };
      })
    );
  
    return uploadedMedia; // array with updated URLs
  }

  const handleDraft = async () => {
    if (!user || !uri || media.length === 0) {
      console.error("Missing submission data.")
      return;
    }
    
    let thumbnail:string | null = null;
    if (media[0].type === 'video') {
      try {
        thumbnail = await createThumbnail(media[0].uri);
        console.log("Thumbnail result:", thumbnail);
      } catch (error) {
        console.error("Error creating thumbnail:", error);
      }
    } else {
      thumbnail = media[0].uri; 
    }

    if (!thumbnail) {
      console.error("No thumbnail created or available.");
      return;
    }

    const submissionData = {
      id: Date.now().toString(),
      media: media,
      caption: caption,
      thumbnail: thumbnail
    }
    
    try {
      const draftsRaw = await AsyncStorage.getItem(`drafts_${user.uid}`);
      const drafts = draftsRaw ? JSON.parse(draftsRaw) : [];
      drafts.push(submissionData);
      await AsyncStorage.setItem(`drafts_${user.uid}`, JSON.stringify(drafts));
    } catch (e) {
      console.error('Failed to save draft locally', e);
    }
  
    navigation.reset({
      index: 0,
      routes: [{ name: "BattleScreen" }],
    });
  }

  const createThumbnail = async (videoUri: string) => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 1000, // capture at 1 second
      });
      console.log("video thumbnail created", uri); // thumbnail image path
      return uri;
    } catch (e) {
      console.warn(e);
      return null;
    }
  }

  return (
      <SafeAreaView>
        <ScrollView>
        <Button
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "ResponseScreen",
                  params: { battleId: battleId, dare: dare, gameMode: gameMode },
                },
              ],
            })
          }
          title="x"
        />
      {media
        .map((item, index) => (
          <View key={index} style={{ marginBottom: 12 }}>
          {item.type === 'photo' ? (
            <Image
            source={{ uri: item.uri }}
            contentFit="contain"
            style={{ width: 300, aspectRatio: 1 }}
          />
          ) : (
            <Video
            source={{ uri: item.uri }}
            style={{ width: 300, height: 300 }}
            useNativeControls
            shouldPlay
            isLooping
          />
          )}
          <Button
            title="Remove"
            onPress={() => {
              setMedia(prev => prev.filter((_, i) => i !== index));
            }} />
          </View>
        ))}
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Write a caption"
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 12,
            marginBottom: 12,
          }}
        />
        {gameMode === 'survival' ? (
          <TextInput
          value={newDare}
          onChangeText={setNewDare}
          placeholder="Write a dare for your opponent"
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 12,
            marginBottom: 12,
          }}
        />
        ) : (
          <View></View>
        )}
        <Button
          title="Save to Draft"
          onPress={handleDraft}
        />
        <Button
          title="Submit"
          onPress={handleSubmit}
        />
        </ScrollView>
      </SafeAreaView>
  );
}