import { SafeAreaView, View, Text, Button, ScrollView, TouchableOpacity, Image } from "react-native";
import { LeaderboardProps } from "../../types";
import { useAuth } from "../../context/AuthContext";
import React, { useState, useCallback, useEffect } from "react";
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
  documentId,
} from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

type Friend = {
  uid: string;
  userName: string;
  avatarUrl: string;
  name: string;
  status: string;
  last_active: any;
  coins: number;
};


export default function FriendsBoard({navigation}: LeaderboardProps<'FriendsBoard'>) {
  const { user } = useAuth();
  const [friendsList, setFriendsList] = useState<Friend[]>([]);

  useEffect(() => {
    fetchFriends();
  })

  const fetchFriends = async () => {
          if (!user) return;
          
          try {
              // 1. Get all active friendships (both sent and received)
              const sentQuery = query(collection(db, "friends"), where("sender_id", "==", user.uid), where("status", "==", "active"));
              const receivedQuery = query(collection(db, "friends"), where("receiver_id", "==", user.uid), where("status", "==", "active"));
          
              const [sentSnap, receivedSnap] = await Promise.all([
              getDocs(sentQuery),
              getDocs(receivedQuery),
              ]);
  
              const friendsList: string[] = [];
  
              sentSnap.forEach(doc => {
              const data = doc.data();
                  friendsList.push(data.receiver_id);
              });
          
              receivedSnap.forEach(doc => {
              const data = doc.data();
              friendsList.push(data.sender_id);
              });

              friendsList.push(user.uid);
  
              const chunkSize = 10;
  
              if (friendsList.length > 0) {
                  const chunks = [];
                  for (let i = 0; i < friendsList.length; i += chunkSize) {
                      chunks.push(friendsList.slice(i, i + chunkSize));
                  }
  
                  const friendData: Friend[] = [];
                  for (const chunk of chunks) {
                      const q = query(collection(db, "users"), where(documentId(), "in", chunk));
                      const querySnapshot = await getDocs(q);
  
                      querySnapshot.forEach((doc) => {
                          const data = doc.data();
                          friendData.push({
                          uid: doc.id,
                          userName: data.username,
                          avatarUrl: data.avatar_url,
                          name: data.name,
                          status: "active",
                          last_active: data.last_active,
                          coins: data.coins
                          });
                      });
                  }

                  setFriendsList(
                    friendData.sort((a, b) => b.coins - a.coins) // Compare coins in descending order
                  );
              }

      } catch (error) {
          console.error("Error fetching friends:", error);
      }
    }

    const onViewProfile = (userId: string) => {
      navigation.navigate('OtherProfiles', { userId: userId });
    }
  

    return (
    <SafeAreaView>
      <ScrollView>
        {friendsList
          .filter((user) => user !== null)
          .map((user, index) => (
              <View key={user.uid} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text>{index + 1}</Text>
              <TouchableOpacity onPress={() => onViewProfile(user.uid)}>
                  <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
                  />
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => onViewProfile(user.uid)}>
                  <Text style={{ fontWeight: 'bold' }}>{user.userName}</Text>
                  <Text style={{ color: '#666' }}>{user.name}</Text>
              </TouchableOpacity>
              <Text style={{ color: '#666', marginRight: 10 }}>{user.coins} coins</Text>
              </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}