import { View, Text, Button, SafeAreaView, Image, TextInput } from "react-native";
import { ProfileStackProps } from "../../types";
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from "../../context/AuthContext";
import { db } from "../../../firebaseConfig";
import React, { useState, useEffect } from "react";
import * as ImagePicker from 'expo-image-picker';
import { updateDoc, doc } from "firebase/firestore";

type EditInterestRouteParams = {
    interestId: string;
    imageUri: string[];
    caption: string;
};
  
type EditInterestRouteProp = RouteProp<
    { EditInterest: EditInterestRouteParams },
    'EditInterest'
>;

export default function EditInterestScreen({ navigation }: ProfileStackProps<'EditInterest'>) {
    const route = useRoute<EditInterestRouteProp>();
    const interestId = route.params.interestId;
    const [imageUri, setImageUri] = useState(route.params.imageUri);
    const [caption, setCaption] = useState(route.params.caption);
    const { user } = useAuth();

      const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true, 
          quality: 1,
        });
      
        if (!result.canceled) {
          // TypeScript now knows that `result` is of type `ImagePickerSuccessResult`
          setImageUri((prevUris) => [...prevUris, result.assets[0].uri]);
        }
      };

      const handleSave = async () => {
            if (!user) {
              console.error("User is not authenticated");
              return;
            }
        
            try {
              const interestsRef = doc(db, "users", user.uid, "interests", interestId);

              const docRef = await updateDoc(interestsRef, {
                imageUri,
                caption,
              });
        
              navigation.navigate('ProfileScreen');
            } catch (error) {
              console.error("Error updating profile:", error);
            }
          }

  return (
    <SafeAreaView>
      {imageUri
        .map((image, index) => (
        <View key={index}>
            <Image
                source={{ uri: image }}
                style={{ width: 50, height: 50, marginRight: 10 }}
            />
            <Button title="delete" onPress={() => {
                setImageUri((prevUris) => prevUris.filter((uri) => uri !== image));
            }} />
        </View>
        ))}
    {imageUri.length < 5 ? (
        <Button
        title="Upload an Image"
        onPress={pickImage}
    />
    ): null}
    <TextInput
    value={caption}
    onChangeText={setCaption}
    placeholder={caption}
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
        title="Save Changes"
        onPress={handleSave}
      />
    </SafeAreaView>
  );
}