import { View, Text, Button, SafeAreaView, Image, 
  ScrollView, TouchableOpacity, TextInput, Modal, Pressable, StyleSheet
} from "react-native";
import { ProfileStackProps } from "../../types";
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from "../../context/AuthContext";
import { db } from "../../../firebaseConfig";
import { updateDoc, doc, } from "firebase/firestore";
import React, { useState, useEffect } from "react";


type EditProfileRouteParams = {
  userProfile: User;
};

type EditProfilesRouteProp = RouteProp<
    { EditProfileScreen: EditProfileRouteParams },
    'EditProfileScreen'
>;

type User = {
  userName: string;
  avatarUrl: string;
  name: string;
  bio: string;
};


export default function EditProfileScreen({navigation}: ProfileStackProps<'EditProfileScreen'>) {
  const route = useRoute<EditProfilesRouteProp>();
  const [userName, setUserName] = useState(route.params.userProfile.userName);
  const [avatarUrl, setAvatarUrl] = useState(route.params.userProfile.avatarUrl);
  const [name, setName] = useState(route.params.userProfile.name);
  const [bio, setBio] = useState(route.params.userProfile.bio);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isViewingImage, setIsViewingImage] = useState(false);

  const { user } = useAuth();

  const handleSave = async () => {
    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        avatar_url: avatarUrl,
        bio: bio,
        name: name,
        username: userName,
    });

      navigation.goBack();
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  }
  
  return (
    <SafeAreaView>
      <Text>Edit your profile!</Text>
      <View>
        <Image
        source={{ uri: avatarUrl }}
        style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
        />
          <Button title="View profile photo" onPress={() => setIsViewingImage(true)}/>

          <Modal visible={isViewingImage} transparent={true}>
            <View style={styles.modalContainer}>
              <Image
              source={{ uri: avatarUrl }}
              style={styles.fullImage}
              resizeMode="contain"
              />
              <Pressable onPress={() => setIsViewingImage(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>
          </Modal>

        <Button title="Take Photo"/>
        <Button title="Upload Photo"/>

        <TextInput
        value={userName}
        onChangeText={setUserName}
        placeholder={userName}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 12,
          marginBottom: 12,
        }}
      />

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={name}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 12,
          marginBottom: 12,
        }}
      />

      <TextInput
        value={bio}
        onChangeText={setBio}
        placeholder={bio}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 12,
          marginBottom: 12,
        }}
      />

    </View>
      <Button
        title="Save Changes"
        onPress={handleSave}
      />
    </SafeAreaView>
  )}
  
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
