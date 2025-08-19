import { View, Text, Button, SafeAreaView, Image, TextInput, ScrollView} from "react-native";
import { ProfileStackProps } from "../../types";
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

type Media = {
  type: string;
  uri: string;
}

export default function AddInterestScreen({ navigation }: ProfileStackProps<'AddInterests'>) {
    const[imageUri, setImageUri] = useState<Media[]>([]);
    const [caption, setCaption] = useState<string>('');
    const { user } = useAuth();


  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, 
      quality: 1,
    });
  
    if (!result.canceled) {
      // TypeScript now knows that `result` is of type `ImagePickerSuccessResult`
      setImageUri((prevUris) => [...prevUris, {type: 'photo', uri: result.assets[0].uri} ]);
    }
  };

    const handleSave = async () => {
      if (!user) {
        console.error("User is not authenticated");
        return;
      }
  
      try {
        const interestsRef = collection(db, "users", user.uid, "interests");
        const newInterest = {
            image_url: imageUri,
            caption,
            created_at: new Date(),
          };
        
        const docRef = await addDoc(interestsRef, newInterest);
  
        navigation.navigate('ProfileScreen');
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    }

  return (
    <SafeAreaView>
      <Text>Add an interest</Text>
      {imageUri.length > 0 ? (
        <ScrollView horizontal={true}>
        {imageUri
        .map((uri) => (
            <Image
            key={uri.uri}
            source={{ uri: uri.uri }}
            style={{ width: 200, height: 200, marginRight: 10 }}
            />
        ))}
      </ScrollView>
      ) : (
      null
    )}
    {imageUri.length < 5 ? (
        <Button
        title="Upload an Image"
        onPress={pickImage}
    />
    ): null}
    <Text></Text>
    <TextInput
    value={caption}
    onChangeText={setCaption}
    placeholder="Describe your interest"
    style={{
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        marginBottom: 12,
    }}
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