import { View, Text, Button, SafeAreaView, Image, Modal, 
    StyleSheet, Pressable, TextInput } from "react-native";
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ProfileStackProps } from "../../types";
import * as ImagePicker from 'expo-image-picker';
import { db } from "../../../firebaseConfig";
import { updateDoc, doc, } from "firebase/firestore";


export default function EditPin({ navigation, route }: ProfileStackProps<'EditPin'>) {
    const { battle } = route.params;
    const [ title, setTitle ] = useState(battle.title);
    const [isViewingImage, setIsViewingImage] = useState(false);
    const { user } = useAuth();

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true, 
          quality: 1,
        });
      
        if (!result.canceled) {
          // TypeScript now knows that `result` is of type `ImagePickerSuccessResult`
          navigation.navigate('CropScreen', { imageUri: result.assets[0].uri, battle: battle });
        }
      };

    const handleSave = async () => {
        if (!user) {
          console.error("User is not authenticated");
          return;
        }
    
        try {
          const userRef = doc(db, 'users', user.uid, 'pinned_games', battle.id);
          await updateDoc(userRef, {
            title: title,
        });
    
          navigation.goBack();
        } catch (error) {
          console.error("Error updating profile:", error);
        }
      }

return (
    <SafeAreaView>
          <Text>Edit Pinned Game</Text>
          <View>
            <Image
            source={{ uri: battle.thumbnail }}
            style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
            />
              <Button title="View Thumbnail" onPress={() => setIsViewingImage(true)}/>
    
              <Modal visible={isViewingImage} transparent={true}>
                <View style={styles.modalContainer}>
                  <Image
                  source={{ uri: battle.thumbnail }}
                  style={styles.fullImage}
                  resizeMode="contain"
                  />
                  <Pressable onPress={() => setIsViewingImage(false)} style={styles.closeButton}>
                    <Text style={styles.closeText}>Close</Text>
                  </Pressable>
                </View>
              </Modal>
            <Button title="Edit Thumbnail" onPress={pickImage}/>
    
            <Text style={{ marginVertical: 12 }}>Edit Title</Text>
            <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={title}
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 12,
              marginBottom: 12,
            }}
          />
    
        </View>
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

const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: 'black',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fullImage: {
      width: '100%',
      height: '80%',
    },
    closeButton: {
      marginTop: 20,
      padding: 10,
      backgroundColor: 'white',
      borderRadius: 8,
    },
    closeText: {
      color: 'black',
      fontWeight: 'bold',
    },
  });
  