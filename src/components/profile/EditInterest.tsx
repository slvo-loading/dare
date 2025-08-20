import { View, Text, Button, SafeAreaView, Image, TextInput, 
  ScrollView, StyleSheet } from "react-native";
import { ProfileStackProps } from "../../types";
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../../firebaseConfig";
import React, { useState, useEffect } from "react";
import * as ImagePicker from 'expo-image-picker';
import { updateDoc, doc } from "firebase/firestore";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";


type Media = {
  type: 'photo';
  uri: string;
}

export default function EditInterestScreen({ navigation, route }: ProfileStackProps<'EditInterest'>) {
    const interestId = route.params.interestId;
    const [imageUri, setImageUri] = useState(route.params.imageUrl);
    const [newImageUri, setNewImageUri] = useState<Media[]>([]);
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
          setNewImageUri((prevUris) => [...prevUris, {type: 'photo', uri: result.assets[0].uri}]);
        }
      };

      const handleSave = async () => {
            if (!user) {
              console.error("User is not authenticated");
              return;
            }
        
            try {
              const interestsRef = doc(db, "users", user.uid, "interests", interestId);

              let combinedMedia = imageUri;

              if (newImageUri.length > 0) {
                const updatedMedia = await uploadAllMedia();
                if (!updatedMedia) return;
                combinedMedia = [...imageUri, ...updatedMedia];
              }

              await updateDoc(interestsRef, {
                image_url: combinedMedia,
                caption,
              });
        
              navigation.navigate('ProfileScreen');
            } catch (error) {
              console.error("Error updating profile:", error);
            }
          }

    async function uploadAllMedia() {
          if (!user) return;
          const uploadedMedia = await Promise.all(
            newImageUri.map(async (item, index) => {
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

  return (
    <SafeAreaView>
      <ScrollView>
      {imageUri
        .map((image, index) => (
        <View key={index} style={styles.imageContainer}>
            <Image
                source={{ uri: image.uri }}
                style={styles.image}
            />
            <Button title="delete" onPress={() => {
                setImageUri((prevUris) => prevUris.filter((uri) => uri !== image));
            }} />
        </View>
      ))}
      {newImageUri
        .map((image, index) => (
        <View key={index} style={styles.imageContainer}>
            <Image
                source={{ uri: image.uri }}
                style={styles.image}
            />
            <Button title="delete" onPress={() => {
                setImageUri((prevUris) => prevUris.filter((uri) => uri !== image));
            }} />
        </View>
      ))}

    {imageUri.length + newImageUri.length < 5 && (
        <Button
        title="Upload an Image"
        onPress={pickImage}
    />
    )}

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    marginVertical: 10,
  },
  scrollContent: {
    flexDirection: 'row', // Ensure children are laid out horizontally
    alignItems: 'center',
  },
  imageContainer: {
    marginRight: 10, // Space between images
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginTop: 20,
    borderRadius: 5,
  },
});