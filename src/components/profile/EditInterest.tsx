import { View, Text, Button, SafeAreaView, Image, TextInput, 
  ScrollView, StyleSheet } from "react-native";
import { ProfileStackProps } from "../../types";
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from "../../context/AuthContext";
import { db } from "../../../firebaseConfig";
import React, { useState, useEffect } from "react";
import * as ImagePicker from 'expo-image-picker';
import { updateDoc, doc } from "firebase/firestore";

export default function EditInterestScreen({ navigation, route }: ProfileStackProps<'EditInterest'>) {
    const interestId = route.params.interestId;
    const [imageUri, setImageUri] = useState(route.params.imageUrl);
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
          setImageUri((prevUris) => [...prevUris, {type: 'photo', uri: result.assets[0].uri}]);
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