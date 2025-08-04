import { View, Text, Button, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
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
  setDoc,
  Timestamp,
} from 'firebase/firestore';

type Friend = {
  uid: string;
  userName: string;
  avatarUrl: string;
  name: string;
  last_active: any;
};

type InviteScreenRouteProp = RouteProp<
  { InviteFriend: { dare: { userName: string, userId: string, dare: string} } },
  'InviteFriend'
>;

export default function InviteFriendScreen({ navigation }: BattleStackProps<'InviteFriend'>) {
  const { user } = useAuth();
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const route = useRoute<InviteScreenRouteProp>();
  const [dare, setDare] = useState(route.params.dare);

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
  
  const sendInvite = async (friendId: string, friendName: string) => {
    if(!user) return;

    const id = [user.uid, friendId].sort().join("_");
    const ref = doc(db, 'games', id);

    await setDoc(ref, {
      player1Id: user.uid,
      player2Id: friendId,
      dareFromPlayer1: dare,
      dareFromPlayer2: 'pending',
      status: 'pending',
      startDate: Timestamp.now(),
      endDate: null,
      winner: null
    });

    navigation.navigate('GameStart', { 
      type: 'friend', 
      match: {
        opponentName: friendId,
        opponentId: friendName,
        dare: 'pending',
      }
    });
  }


  return (
    <View>
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
            <TouchableOpacity onPress={() => {setSelectedId(friend!.uid); setSelectedName(friend!.userName)}}>
                <Text style={{ color: 'blue' }}>select</Text>
            </TouchableOpacity>
            </View>
        ))}
    </ScrollView>
    {selectedId && selectedName ? (
      <Button title="Next" onPress={() => sendInvite(selectedId, selectedName)}/>
    ) : (
      <Button title="Next" onPress={() => Alert.alert("Please select a friend")}/>
    )}
    </View>
  );
}