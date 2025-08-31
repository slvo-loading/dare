import { View, SafeAreaView, Text, Button, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { useRoute, RouteProp } from '@react-navigation/native';
import { BattleStackProps } from "../../types";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../../firebaseConfig";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  Timestamp,
  runTransaction
} from 'firebase/firestore';

type Friend = {
  uid: string;
  userName: string;
  avatarUrl: string;
  name: string;
  last_active: any;
};

type InviteScreenRouteProp = RouteProp<
  { InviteFriend: { dare: string, coins: number } },
  'InviteFriend'
>;

export default function InviteFriendScreen({ navigation }: BattleStackProps<'InviteFriend'>) {
  const { user } = useAuth();
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const route = useRoute<InviteScreenRouteProp>();
  const [dare, setDare] = useState(route.params.dare);
  const coins = route.params.coins;

  useEffect(() => {
    fetchFriends();
  }, []);
  
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

          // 2. Extract the other person’s ID in each case
          const friendIds: string[] = [];
      
          sentSnap.forEach(doc => {
          const data = doc.data();
          friendIds.push(data.receiver_id);
          });
      
          receivedSnap.forEach(doc => {
          const data = doc.data();
          friendIds.push(data.sender_id);
          });
      
          // 3. Fetch user info for each friend
          const friendData = await Promise.all(
          friendIds.map(async (id) => {
              const userDoc = await getDoc(doc(db, "users", id));
              if (userDoc.exists()) {
              const data = userDoc.data();
              return {
                  uid: id,
                  userName: data.username,
                  avatarUrl: data.avatar_url,
                  name: data.name,
                  last_active: data.last_active,
              };
              }
              return null;
          })
          );
      
          // 4. Clean out nulls and sort based on last active time
          const filteredFriend = friendData
          .filter((friend): friend is Friend => friend !== null)
          .sort((a, b) => {
              const aTime = a.last_active?.toMillis?.() || 0;
              const bTime = b.last_active?.toMillis?.() || 0;
              return bTime - aTime
          });
      
          // 5. Save to state
          setFriendsList(filteredFriend);
      
      } catch (err) {
          console.error("Error fetching friends:", err);
      }
  };

  const onViewProfile = (friendId: string) => {
    console.log('open a modal of the profile')
  };
  
  const sendInvite = async () => {
    if (!user || !selectedFriend) return;
  
    const userRef = doc(db, "users", user.uid);
  
    await runTransaction(db, async (transaction) => {
      // Get fresh user data
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error("User not found");
  
      const currentCoins = userSnap.data().coins || 0;
  
      // Check balance
      if (currentCoins < coins) {
        throw new Error("Not enough coins to send invite");
      }
  
      // Deduct coins
      transaction.update(userRef, {
        coins: currentCoins - coins,
      });
  
      // Create game doc
      const gameRef = doc(collection(db, "games"));
      transaction.set(gameRef, {
        player1_id: user.uid,
        player2_id: selectedFriend.uid,
        user: [user.uid, selectedFriend.uid],
        player1_dare: dare,
        player2_dare: null,
        status: "pending",
        coins: coins,
      });

      user.coins = currentCoins - coins; 
    });
  
    // Navigate after transaction is committed
    navigation.navigate("GameStart", { 
      type: "friend", 
      match: {
        opponentName: selectedFriend.userName,
        opponentId: selectedFriend.uid,
        opponentAvatar: selectedFriend.avatarUrl,
        opponentUserName: selectedFriend.userName,
        dare: '',
      }
    });
  };


  return (
    <SafeAreaView>
      <Text>send the invite to your friend</Text>
      <ScrollView>
        {friendsList
        .filter((friend) => friend !== null)
        .map((friend) => (
            <View key={friend?.uid} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <TouchableOpacity onPress={() => onViewProfile(friend!.uid)}>
                <Image
                source={{ uri: friend!.avatarUrl }}
                style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
                />
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => onViewProfile(friend!.uid)}>
                <Text style={{ fontWeight: 'bold' }}>{friend!.userName}</Text>
                <Text style={{ color: '#666' }}>{friend!.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedFriend(friend)}>
                <Text style={{ color: 'blue' }}>select</Text>
            </TouchableOpacity>
            </View>
        ))}
    </ScrollView>
    {selectedFriend && (
      <Button title="Next" onPress={() => sendInvite()}/> )}
    </SafeAreaView>
  );
}