import { View, Text, Button, TextInput } from "react-native";
import { BattleStackProps } from "../../types";
import { useRoute, RouteProp } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { addDoc, collection, serverTimestamp, doc, updateDoc, arrayRemove, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { Image } from "expo-image";

type SubmitRouteParams = {
  uri: string;
  battleId: string;
  dare: string;
  gameMode: string;
};

type SubmitRouteProp = RouteProp<
  { SubmitScreen: SubmitRouteParams },
  'SubmitScreen'
>;

export default function SubmitScreen({ navigation }: BattleStackProps<'SubmitScreen'>) {
  const route = useRoute<SubmitRouteProp>();
  const { uri, battleId, dare, gameMode } = route.params;
  const [caption, setCaption] = useState<string>('');
  const [newDare, setNewDare] = useState<string>('');
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
      media_url: uri, 
      dare: dare,
      type: 'photo',
      submitted_at: serverTimestamp(),
      caption: caption,
    }

    await addDoc(submissionsRef, submissionData);

    try {

      if (gameMode === 'survival') {
        const battleSnap = await getDoc(battleRef);
        const battleData = battleSnap.data();
        const player1 = user.uid === battleData?.player1_id;

        // removes the dare from the players to do array
        await updateDoc(battleRef, {
          [`${player1 ? "player2_dare" : "player1_dare"}`]: arrayRemove(dare)
        });

        // appends new dare to the players giving array
        // const currentArray = battleData?.[player1 ? 'player1_dare' : 'player2_dare'];
        // currentArray.push(newDare);
        // await updateDoc(battleRef, {
        //   [`${player1 ? "player1_dare" : "player2_dare"}`]: currentArray
        // })
        await updateDoc(battleRef, {
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

  return (
      <View>
        <Image
          source={{ uri }}
          contentFit="contain"
          style={{ width: 300, aspectRatio: 1 }}
        />
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
          title="Submit"
          onPress={handleSubmit}
        />
      </View>
  );
}