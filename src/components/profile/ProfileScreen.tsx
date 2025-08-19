import { View, Text, Button, SafeAreaView, Image, 
  TouchableOpacity, ActivityIndicator, ScrollView, Modal, Alert,
StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProfileStackProps } from '../../types';
import { db } from '../../../firebaseConfig';
import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import PostView from '../battle/PostView';

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  deleteDoc,
  orderBy
} from 'firebase/firestore';

type User = {
  userName: string;
  avatarUrl: string;
  name: string;
  bio: string;
  friendCount: number;
  coins: number;
};


type Battle = {
  id: string;
  thumbnail: string;
  title: string
}

type Interests = {
  id: string;
  caption: string;
  imageUrl: Media[];
  createdAt: string;
}

type Media = {
  type: string;
  uri: string;
}

export default function ProfileScreen({ navigation }: ProfileStackProps<'ProfileScreen'>) {
  const { logout, tempLogout, user } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [interests, setInterests] = useState<Interests[]>([]);
  const [pinnedGames, setPinnedGames] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<Battle | null>(null);
  const [showSubmissions, setShowSubmissions] = useState<boolean>(false);
  const [type, setType] = useState<string>('');
  const [index, setIndex] = useState<number>(0);

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('onboardingComplete');
      console.log('Onboarding reset successfully');
    } catch (e) {
      console.error('Error resetting onboarding:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      fetchInterests();
      fetchPinnedGames();
      setLoading(false);
  }, [])
);

  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const sentQuery = query(
        collection(db, "friends"),
        where("sender_id", "==", user.uid),
        where("status", "==", "active")
      );

      const receivedQuery = query(
        collection(db, "friends"),
        where("receiver_id", "==", user.uid),
        where("status", "==", "active")
      );

      const [sentSnap, receivedSnap] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery)
      ]);

      const totalFriends = sentSnap.size + receivedSnap.size;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        console.error('User profile not found');
        return;
      }

      const userData = userDoc.data();
      setUserProfile({
        userName: userData.username,
        avatarUrl: userData.avatar_url,
        name: userData.name,
        bio: userData.bio,
        friendCount: totalFriends,
        coins: userData.coins,
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  const fetchInterests = async () => {
    if (!user) return;
    try {
      const interestsRef = query(
        collection(db, 'users', user.uid, 'interests'),
        orderBy('created_at', 'desc')
      );
      const interestsSnap = await getDocs(interestsRef);
      const interests = interestsSnap.docs
        .map(doc => ({ 
          id: doc.id,
          caption: doc.data().caption,
          imageUrl: doc.data().image_url,
          createdAt: doc.data().created_at.toDate().toISOString()
        }));

      setInterests(interests);
    } catch (error) {
      console.error('Error fetching interests:', error);
    }
  };

  const deleteInterest = async (interestId: string) => {
    if (!user) return;
    try {
      const interestRef = doc(db, 'users', user.uid, 'interests', interestId);
      await deleteDoc(interestRef);
      setInterests(prev => prev.filter(interest => interest.id !== interestId));
    } catch (error) {
      console.error('Error deleting interest:', error);
    }
  }

  const fetchPinnedGames = async () => {
    if (!user) return;
    try {
      const pinnedGamesRef = collection(db, 'users', user.uid, 'pinned_games');
      const pinnedGamesSnap = await getDocs(pinnedGamesRef);
      let battle: Battle[] = [];
      pinnedGamesSnap.forEach(doc => {
        const data = doc.data();
        battle.push({
          id: doc.id,
          thumbnail: data.thumbnail,
          title: data.title
        });
      });

      setPinnedGames(battle);
    } catch (error) {
      console.error('Error fetching pinned games:', error);
    }
  };

  const deletePin = async (battleId: string) => {
    if (!user) return;

    try {
      const pinnedGameRef = doc(db, 'users', user.uid, 'pinned_games', battleId);
      await deleteDoc(pinnedGameRef);
      setPinnedGames(prev => prev.filter(battle => battle.id !== battleId));
    } catch (error) {
      console.error('Error deleting pinned game:', error);
    }
  };

  const deleteGameAlert = (battleId: string) =>
    Alert.alert('Delete Pinned Game', 'This will permanently delete this pinned game.', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {text: 'Delete', onPress: () => deletePin(battleId)},
    ]);

    const deleteInterestAlert = (interestId: string) =>
      Alert.alert('Delete Post', 'This will permanently delete this post.', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {text: 'Delete', onPress: () => deleteInterest(interestId)},
      ]);

  return (
    <SafeAreaView>
    {loading ? <ActivityIndicator size="large" color="#0000ff" /> : null}
      {userProfile ? (
        <View>
            <Image
            source={{ uri: userProfile.avatarUrl }}
            style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
            />
            <Text style={{ fontWeight: 'bold' }}>username: {userProfile.userName}</Text>
            <Text style={{ color: '#666' }}>name: {userProfile.name}</Text>
            <Text style={{ color: '#666' }}>bio: {userProfile.bio}</Text>
            <Text style={{ color: '#666' }}>coins: {userProfile.coins}</Text>
            <Button title={`${userProfile.friendCount} Friends`} onPress={() => navigation.navigate('FriendsList')}/>

            {pinnedGames.length > 0 && (
          <ScrollView horizontal={true} style={{ marginLeft: 10 }}>
              {pinnedGames
              .map((battle) => (
                  <View key={battle.id} style={{ flexDirection: 'column', alignItems: 'center', marginRight: 10 }}>
                    <TouchableOpacity onPress={() => {setSelectedGame(battle); setType('pinned'); setShowSubmissions(true);}} style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                      <Image
                      source={{ uri: battle.thumbnail }}
                      style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
                      />
                      <Text>{battle.title}</Text>
                    </TouchableOpacity>
                    <Button title="Edit" onPress={() => navigation.navigate('EditPin', {battle: battle})}/>
                    <Button title="Delete" onPress={() => deleteGameAlert(battle.id)}/>
                  </View>
              ))}
          </ScrollView>
        )}


          <Button title="Add a post" onPress={() => navigation.navigate('AddInterests')}/>
          {interests.length > 0 && (
          <ScrollView horizontal={true} style={{ marginLeft: 10 }}>
              {interests
              .map((interest, index) => (
                <View key={interest.id} style={{ flexDirection: 'column', alignItems: 'center', marginBottom: 10, }}>
                      <View style={{ flexDirection: 'column', alignItems: 'center', marginRight: 10 }}>
                      <TouchableOpacity onPress={() => { setIndex(index); setType('interests'); setShowSubmissions(true);}}>
                        <Image
                          source={{ uri: interest.imageUrl?.[0].uri }}
                          style={{ width: 150, aspectRatio: 1, marginRight: 10 }}
                        />
                        </TouchableOpacity>
                          <Button title="Edit" onPress={() => navigation.navigate('EditInterest', {interestId: interest.id, caption: interest.caption, imageUrl: interest.imageUrl})}/>
                          <Button title="Delete" onPress={() => deleteInterestAlert(interest.id)}/>
                        </View>
                </View>
              ))}
          </ScrollView>
        )}

          <Modal
            animationType="slide"
            transparent={true}
            visible={showSubmissions}
            onRequestClose={() => setShowSubmissions(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Button title="X" onPress={() => setShowSubmissions(false)} />
                  {type === 'interests' ? (
                    <PostView interests={interests} type={type} startIndex={index} />
                  ) : (
                    <PostView battleId={selectedGame?.id || ''} dare={selectedGame?.title || ''} type={type}/>
                  )}
              </View>
            </View>
          </Modal>
        </View>
      ) : (
        <ActivityIndicator size="large" color="#0000ff" />
      )}
      <Text></Text>
      <Text></Text>
      <Text></Text>
      {/* <Button title="Reset Onboarding" onPress={resetOnboarding} /> */}
      <Button
        title="Edit Profile"
        onPress={() => navigation.navigate('EditProfileScreen', {userProfile: 
          {
            userName: userProfile?.userName,
            avatarUrl: userProfile?.avatarUrl,
            name: userProfile?.name ,
            bio: userProfile?.bio ,
          }, })}
      />
      <Button
        title="Settings"
        onPress={() => navigation.navigate('Settings')}
      />
      <Button 
        title="Temporary Logout"
        onPress={() => {
          tempLogout();
        }}
        />
        {/* <Button title="Sign Out" onPress={logout} /> */}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent background
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '80%',
      height: '80%',
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5, // For Android shadow
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    modalText: {
      fontSize: 16,
      color: '#333',
      marginBottom: 8,
      textAlign: 'center',
    },
  });