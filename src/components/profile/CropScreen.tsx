import { View, Text, Button, SafeAreaView, Image, StyleSheet, Dimensions } from "react-native";
import { ProfileStackProps } from "../../types";
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from "../../context/AuthContext";
import { db } from "../../../firebaseConfig";
import { updateDoc, doc, } from "firebase/firestore";
import React from "react";

type CropScreenRouteParams = {
    imageUri: string;
};
  
type CropScreenRouteProp = RouteProp<
    { CropScreen: CropScreenRouteParams },
    'CropScreen'
>;


export default function CropScreen({ navigation }: ProfileStackProps<'CropScreen'>) {
  const route = useRoute<CropScreenRouteProp>();
  const { imageUri } = route.params;
  const { user } = useAuth();

  const handleSave = async () => {
    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        avatar_url: imageUri,
    });

      navigation.navigate('ProfileScreen');
    } catch (error) {
      console.error("Error updating profile:", error);
    }
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
