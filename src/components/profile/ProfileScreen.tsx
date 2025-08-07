import { View, Text, Button, SafeAreaView, Image, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { useAuth } from "../../context/AuthContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProfileStackProps } from '../../types';
import { db } from '../../../firebaseConfig';
import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  deleteDoc, 
  setDoc, 
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

type User = {
  userName: string;
  avatarUrl: string;
  name: string;
  bio: string;
  friendCount: number;
  rank: string;
};

type Interests = {
  id: string;
  title: string;
  description: string;
  imageUrl: string[];
}

export default function ProfileScreen({ navigation }: ProfileStackProps<'ProfileScreen'>) {
  const { logout, tempLogout, user } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [interests, setInterests] = useState<Interests[]>([]);
  const [pinnedGames, setPinnedGames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
        rank: userData.rank
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  const fetchInterests = async () => {
    if (!user) return;
    try {
      const interestsRef = collection(db, 'users', user.uid, 'interests');
      const interestsSnap = await getDocs(interestsRef);
      const interests = interestsSnap.docs
        .map(doc => ({ 
          id: doc.id,
          title: doc.data().title,
          description: doc.data().description,
          imageUrl: doc.data().imageUrl || []
        }));

      setInterests(interests);
    } catch (error) {
      console.error('Error fetching interests:', error);
    }
  };

  const fetchPinnedGames = async () => {
    if (!user) return;
    try {
      const pinnedGamesRef = collection(db, 'users', user.uid, 'pinnedGames');
      const pinnedGamesSnap = await getDocs(pinnedGamesRef);
      const games = pinnedGamesSnap.docs.map(doc => doc.data().gameId);
      setPinnedGames(games);
    } catch (error) {
      console.error('Error fetching pinned games:', error);
    }
  };

  return (
    <SafeAreaView>
    {loading ? <ActivityIndicator size="large" color="#0000ff" /> : null}
      <Text>👤 Profile Screen</Text>
      {userProfile ? (
        <View>
            <Image
            source={{ uri: userProfile.avatarUrl }}
            style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
            />
            <Text style={{ fontWeight: 'bold' }}>username: {userProfile.userName}</Text>
            <Text style={{ color: '#666' }}>name: {userProfile.name}</Text>
            <Text style={{ color: '#666' }}>bio: {userProfile.bio}</Text>
            <Button title={`${userProfile.friendCount} Friends`} onPress={() => navigation.navigate('FriendsList')}/>
            <Text>Rank: {userProfile.rank}</Text>

          {interests.length < 3 ? <Button title="Add an interest"/> : null}
          {interests.length > 0 ? (
          <ScrollView>
              {interests
              .map((interest) => (
                  <View key={interest.title} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Button title="Delete"/>
                    <Button title="Edit"/>
                    <Text style={{ fontWeight: 'bold', marginRight: 10 }}>Title: {interest.title}</Text>
                    <Text style={{ fontWeight: 'bold', marginRight: 10 }}>Description: {interest.description}</Text>
                    {interest.imageUrl
                    .map((image) => (
                      <Image
                        key={image}
                        source={{ uri: image }}
                        style={{ width: 50, height: 50, marginRight: 10 }}
                      />
                    ))}
                  </View>
              ))}
          </ScrollView>
        ) : (
          <Text>No interests found</Text>
        )}

        <Button title="Edit Pinned Games"/>
        {pinnedGames.length > 0 ? (
          <ScrollView>
              {pinnedGames
              .map((game) => (
                  <View key={game} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Button title="Archive"/>
                    <Text style={{ fontWeight: 'bold', marginRight: 10 }}>Id: {game}</Text>
                  </View>
              ))}
          </ScrollView>
        ) : (
          <Text>No pinned games found</Text>
        )}
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
