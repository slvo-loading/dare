import { View, Text, Button, ScrollView, TouchableOpacity, Image } from "react-native";
import { BattleStackProps } from "../../types";
import React, { use, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../../firebaseConfig";
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

type Battle = 
{
  battleId: string;
  opponentId: string;
  updated_at: any;
  opponentName: string,
  avatarUrl: string,
  users_dare: string,
  status: string
}

export default function BattleScreen({ navigation }: BattleStackProps<'BattleScreen'>) {
  const { user } = useAuth();
  const [battleList, setBattleList] = useState<Battle[]>([]);
  const [pendingInRequests, setPendingInRequests] = useState<Battle[]>([]);
  const [pendingOutRequests, setPendingOutRequests] = useState<Battle[]>([]);

  useEffect(() => {
    fetchBattles();
  }, []);

  const fetchBattles = async () => {
    if (!user) return;

    try {
      const player1Query = query(collection(db, "games"), where("player1_id", "==", user.uid), where("status", "==", "active"));
      const player2Query = query(collection(db, "games"), where("player2_id", "==", user.uid), where("status", "==", "active"));
  
      const [player1Snap, player2Snap] = await Promise.all([
      getDocs(player1Query),
      getDocs(player2Query),
      ]);

      // 2. Extract the other person’s ID in each case
      const battles: Battle[] = [];
  
      player1Snap.forEach(doc => {
        const data = doc.data();
        console.log()
        battles.push({
          battleId: doc.id,
          opponentId: data.player2_id,
          users_dare: data.player2_dare,
          updated_at: data.updated_at,
          status: data.status,
          opponentName: '',
          avatarUrl: ''
        });
      });
  
      player2Snap.forEach(doc => {
        const data = doc.data();
        battles.push({
          battleId: doc.id,
          opponentId: data.player1_id,
          users_dare: data.player1_dare,
          updated_at: data.updated_at,
          status: data.status,
          opponentName: '',
          avatarUrl: ''
        });
      });

      const battleData = await Promise.all(
        battles
        .sort((a, b) => {
          const aTime = a.updated_at?.toMillis?.() || 0;
          const bTime = b.updated_at?.toMillis?.() || 0;
          return bTime - aTime
        })
        .map(async (battle) => {
          const opponentRef = doc(db, "users", battle.opponentId);
          const opponentSnap = await getDoc(opponentRef);
          const opponentData = opponentSnap.exists() ? opponentSnap.data() : null;

          return {
            ... battle,
            opponentName: opponentData?.username,
            avatarUrl: opponentData?.avatar_url
          }
        })
      )

      setBattleList(battleData);

    } catch (err) {
      console.error("Error fetching battles:", err);
    }
  }

  const onViewProfile = (friendId: string) => {
    navigation.navigate('OtherProfiles', { userId: friendId });
  };


  useEffect(() => {
    fetchPendingInRequests();
  }, []);

  const fetchPendingInRequests = async () => {
    if (!user) return;

    try {
      const player2Query = query(collection(db, "games"), where("player2_id", "==", user.uid), where("status", "==", "pending"));
  
      const [player2Snap] = await Promise.all([
      getDocs(player2Query),
      ]);

      // 2. Extract the other person’s ID in each case
      const battles: Battle[] = [];
  
      player2Snap.forEach(doc => {
        const data = doc.data();
        battles.push({
          battleId: doc.id,
          opponentId: data.player1_id,
          users_dare: data.player1_dare,
          updated_at: data.updated_at,
          status: data.status,
          opponentName: '',
          avatarUrl: ''
        });
      });

      const battleData = await Promise.all(
        battles
        .sort((a, b) => {
          const aTime = a.updated_at?.toMillis?.() || 0;
          const bTime = b.updated_at?.toMillis?.() || 0;
          return bTime - aTime
        })
        .map(async (battle) => {
          const opponentRef = doc(db, "users", battle.opponentId);
          const opponentSnap = await getDoc(opponentRef);
          const opponentData = opponentSnap.exists() ? opponentSnap.data() : null;

          return {
            ... battle,
            opponentName: opponentData?.username,
            avatarUrl: opponentData?.avatar_url
          }
        })
      )

      setPendingInRequests(battleData);

    } catch (err) {
      console.error("Error fetching battles:", err);
    }
  }


  const acceptRequest = async (battleId: string) => {

  const ref = doc(db, 'games', battleId);
  await updateDoc(ref, {
      status: 'active',
  });

  fetchPendingInRequests();
  fetchBattles();
  };


  const declineRequest = async (battleId: string) => {
    const ref = doc(db, 'games', battleId);
    await updateDoc(ref, {
        status: 'declined',
    });
  
    fetchPendingInRequests();
  };


  useEffect(() => {
    fetchPendingOutRequests();
  }, []);

  const fetchPendingOutRequests = async () => {
    if (!user) return;

    try {
      const player1Query = query(collection(db, "games"), where("player1_id", "==", user.uid), where("status", "in", ["pending", "declined"]));
  
      const [player1Snap] = await Promise.all([
      getDocs(player1Query),
      ]);

      // 2. Extract the other person’s ID in each case
      const battles: Battle[] = [];
  
      player1Snap.forEach(doc => {
        const data = doc.data();
        battles.push({
          battleId: doc.id,
          opponentId: data.player2_id,
          users_dare: data.player1_dare,
          updated_at: data.updated_at,
          status: data.status,
          opponentName: '',
          avatarUrl: ''
        });
      });

      const battleData = await Promise.all(
        battles
        .sort((a, b) => {
          const aTime = a.updated_at?.toMillis?.() || 0;
          const bTime = b.updated_at?.toMillis?.() || 0;
          return bTime - aTime
        })
        .map(async (battle) => {
          const opponentRef = doc(db, "users", battle.opponentId);
          const opponentSnap = await getDoc(opponentRef);
          const opponentData = opponentSnap.exists() ? opponentSnap.data() : null;

          return {
            ... battle,
            opponentName: opponentData?.username,
            avatarUrl: opponentData?.avatar_url
          }
        })
      )

      setPendingOutRequests(battleData);

    } catch (err) {
      console.error("Error fetching battles:", err);
    }
  }

  const cancelRequest = async (battleId: string) => {
    console.log("Canceling request for battleId:", battleId);
    const ref = doc(db, 'games', battleId);
    await deleteDoc(ref);

    fetchPendingOutRequests();
  };


  return (
    <View>
      <Button 
      title="New Battle"
      onPress={() => navigation.navigate('OpponentSelection')}/>
      <Text>Outgoing Requests</Text>
      <ScrollView>
        {pendingOutRequests
          .filter((battle) => battle !== null)
          .map((battle) => (
              <View key={battle.battleId} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <TouchableOpacity onPress={() => onViewProfile(battle.opponentId)}>
                  <Image
                  source={{ uri: battle.avatarUrl }}
                  style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
                  />
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => onViewProfile(battle.opponentId)}>
                  <Text style={{ fontWeight: 'bold' }}>{battle.opponentName}</Text>
                  <Text style={{ color: '#666' }}>{battle.opponentName}</Text>
              </TouchableOpacity>
              <Text style={{ color: '#666', marginRight: 10 }}>dare sent: {battle.users_dare}</Text>
              <Text style={{ color: '#666', marginRight: 10 }}>status: {battle.status}</Text>
              <Button title="Delete" onPress={() => cancelRequest(battle.battleId)}/>
              </View>
        ))}
      </ScrollView>
      <Text>Incoming Requests</Text>
      <ScrollView>
        {pendingInRequests
          .filter((battle) => battle !== null)
          .map((battle) => (
              <View key={battle.battleId} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <TouchableOpacity onPress={() => onViewProfile(battle.opponentId)}>
                  <Image
                  source={{ uri: battle.avatarUrl }}
                  style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
                  />
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => onViewProfile(battle.opponentId)}>
                  <Text style={{ fontWeight: 'bold' }}>{battle.opponentName}</Text>
                  <Text style={{ color: '#666' }}>{battle.opponentName}</Text>
              </TouchableOpacity>
              <Text style={{ color: '#666', marginRight: 10 }}>{battle.users_dare}</Text>
                <TouchableOpacity onPress={() => acceptRequest(battle.battleId)}>
                    <Text style={{ color: 'blue' }}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => declineRequest(battle.battleId)}>
                    <Text style={{ color: 'red' }}>Decline</Text>
                </TouchableOpacity>
              </View>
        ))}
      </ScrollView>
      <Text>Dares</Text>
    <ScrollView>
      {battleList
      .filter((battle) => battle !== null)
      .map((battle) => (
          <View key={battle.battleId} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => onViewProfile(battle.opponentId)}>
              <Image
              source={{ uri: battle.avatarUrl }}
              style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
              />
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => onViewProfile(battle.opponentId)}>
              <Text style={{ fontWeight: 'bold' }}>{battle.opponentName}</Text>
              <Text style={{ color: '#666' }}>{battle.opponentName}</Text>
          </TouchableOpacity>
          <Text style={{ color: '#666', marginRight: 10 }}>{battle.users_dare}</Text>
          <Button title="Battle"/>
          </View>
      ))}
  </ScrollView>
    </View>
  );
}
