import { SafeAreaView, View, Text, Button, TextInput, ScrollView } from "react-native";
import { BattleStackProps } from "../../types";
import { useRoute, RouteProp } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { addDoc, collection, serverTimestamp, doc, updateDoc, arrayRemove, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { Image } from "expo-image";
// import { useVideoPlayer, VideoView } from 'expo-video';
import { Video } from 'expo-av';

type SubmitRouteParams = {
  uri: NewSubmission[];
  battleId: string;
  dare: string;
  gameMode: string;
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
  const { uri, battleId, dare, gameMode, } = route.params;
  const [caption, setCaption] = useState<string>('');
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

    const submissionData = {
      user_id: user.uid, 
      media: media, 
      dare: dare,
      submitted_at: serverTimestamp(),
      caption: caption,
    }

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
      navigation.navigate('BattleScreen');

    } catch (error) {
      console.error("Error submitting data:", error);
    }
  }

  const handleDraft = async () => {
    if (!user || !uri || !battleId) {
      console.error("Missing submission data.")
      return;
    }

    const battleRef = doc(db, "games", battleId);
    const submissionsRef = collection(battleRef, "drafts");

    const submissionData = {
      user_id: user.uid, 
      media: media,
      caption: caption,
    }

    await addDoc(submissionsRef, submissionData);
    navigation.navigate('BattleScreen');
  }

  return (
      <SafeAreaView>
        <ScrollView>
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
        <Button onPress={() => navigation.goBack()} title="Take another picture" />
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