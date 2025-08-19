import { View, Text, Button, SafeAreaView, Image, StyleSheet, Dimensions } from "react-native";
import { ProfileStackProps } from "../../types";
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../../firebaseConfig";
import { updateDoc, doc,  } from "firebase/firestore";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";

import React from "react";


export default function CropScreen({ navigation, route }: ProfileStackProps<'CropScreen'>) {
  const { imageUri, battle } = route.params;
  const { user } = useAuth();

  const handleSave = async () => {
    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    try {
      const downloadUrl = await uploadMedia();

      if (!battle) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          avatar_url: downloadUrl,
        });
      } else {
        const gameRef = doc(db, 'users', user.uid, 'pinned_games', battle.id);
        await updateDoc(gameRef, {
          thumbnail: downloadUrl,
        });
      }

      navigation.navigate('ProfileScreen');
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  }

  const uploadMedia = async () => {
    if (!user) return;

    const response = await fetch(imageUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `avatars/${user.uid}`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  }

  return (
    <SafeAreaView>
      <Text>Preview</Text>
        <Image
          source={{ uri: imageUri }}
          style={{ width: 200, height: 200, borderRadius: 100, marginRight: 10 }}
          />

      <Button
        title="Cancel"
        onPress={() => navigation.goBack()}
      />
      <Button
        title="Save"
        onPress={handleSave}
      />
    </SafeAreaView>
  );
}
