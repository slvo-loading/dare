import { SafeAreaView, View, Text, Button, ScrollView, TouchableOpacity, Image, Modal } from "react-native";
import { BattleStackProps } from "../../types";
import React, { use, useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../../firebaseConfig";
import { useFocusEffect } from '@react-navigation/native';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  runTransaction,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

type Battle = 
{
  battleId: string;
  opponentId: string;
  opponentName: string,
  avatarUrl: string,
  users_dare: string,
  status: string, 
  coins: number,
  allowSubmission: boolean,
}

type Completed = 
{
  battleId: string;
  opponentId: string;
  opponentName: string,
  avatarUrl: string,
  status: string, 
  winner: string,
  startDate: any,
  endDate: any,
  coins: number,
}

export default function BattleScreen({ navigation }: BattleStackProps<'BattleScreen'>) {
  const { user } = useAuth();
  const [battleList, setBattleList] = useState<Battle[]>([]);
  const [pendingInRequests, setPendingInRequests] = useState<Battle[]>([]);
  const [pendingOutRequests, setPendingOutRequests] = useState<Battle[]>([]);
  const [completedGames, setCompletedGames] = useState<Completed[]>([]);
  const [archivedGames, setArchivedGames] = useState<Completed[]>([]);
  const [brokeModal, setBrokeModal] = useState(false);
  const [availableCoins, setAvailableCoins] = useState<number>(0);
  const [acceptModal, setAcceptModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // refetches everything everytime you change the screen ...hmmmm
  useFocusEffect(
    useCallback(() => {
      fetchBattles();
      fetchCoins();
      setLoading(false);
    }, [])
  )

  const fetchBattles = async () => {
    if (!user) return;

    try {
      const player1Query = query(collection(db, "games"), where("player1_id", "==", user.uid));
      const player2Query = query(collection(db, "games"), where("player2_id", "==", user.uid));
  
      const [player1Snap, player2Snap] = await Promise.all([
      getDocs(player1Query),
      getDocs(player2Query),
      ]);

      // 2. Extract the other person’s ID in each case
      const battles: Battle[] = [];
      const pendingInRequests: Battle[] = [];
      const pendingOutRequests: Battle[] = [];
      const completedGames: Completed[] = [];
      const archivedGames: Completed[] = [];

      const now = new Date();
      const today = now.toISOString().split("T")[0];
    
  
      player1Snap.forEach(doc => {
        const data = doc.data();
        const lastSubDate = data.player1_last_submission.toDate().toISOString().split("T")[0];
        const allowSubs = lastSubDate === today;

        if (data.status === 'active') {
          battles.push({
            battleId: doc.id,
            opponentId: data.player2_id,
            users_dare: data.player1_dare[0] || 'Waiting for dare',
            status: data.status,
            opponentName: '',
            avatarUrl: '',
            coins: data.coins,
            allowSubmission: allowSubs,
          });
        } else if (data.status === 'pending' || data.status === 'declined') {
          pendingOutRequests.push({
            battleId: doc.id,
            opponentId: data.player2_id,
            users_dare: data.player1_dare[0] || 'Waiting for dare',
            status: data.status,
            opponentName: '',
            avatarUrl: '',
            coins: data.coins,
            allowSubmission: allowSubs,
          });
        } else if (data.status === 'completed' && !data.player1_status) {
          completedGames.push({
            battleId: doc.id,
            opponentId: data.player2_id,
            status: data.status,
            opponentName: '',
            avatarUrl: '',
            startDate: data.start_date,
            endDate: data.end_date,
            winner: data.winner,
            coins: data.coins
          });
        } else if (data.status === 'completed' && data.player1_status === 'archived') {
          archivedGames.push({
            battleId: doc.id,
            opponentId: data.player2_id,
            status: data.status,
            opponentName: '',
            avatarUrl: '',
            startDate: data.start_date,
            endDate: data.end_date,
            winner: data.winner,
            coins: data.coins,
          });
        }
      });
  
      player2Snap.forEach(doc => {
        const data = doc.data();

        const lastSubDate = data.player1_last_submission.toDate().toISOString().split("T")[0];
        const allowSubs = lastSubDate === today;
        
        if (data.status === 'active') {
        battles.push({
          battleId: doc.id,
          opponentId: data.player1_id,
          users_dare: data.player1_dare[0] || 'Waiting for dare',
          status: data.status,
          opponentName: '',
          avatarUrl: '',
          coins: data.coins,
          allowSubmission: allowSubs,
        });
      } else if (data.status === 'pending') {
          pendingInRequests.push({
            battleId: doc.id,
            opponentId: data.player1_id,
            users_dare: data.player1_dare[0] || 'Waiting for dare',
            status: data.status,
            opponentName: '',
            avatarUrl: '',
            coins: data.coins,
            allowSubmission: allowSubs,
          });
        } else if (data.status === 'completed' && !data.player2_status) {
          completedGames.push({
            battleId: doc.id,
            opponentId: data.player2_id,
            status: data.status,
            opponentName: '',
            avatarUrl: '',
            startDate: data.start_date,
            endDate: data.end_date,
            winner: data.winner,
            coins: data.coins
          });
        }
        else if (data.status === 'completed' && data.player2_status === 'archived') {
          archivedGames.push({
            battleId: doc.id,
            opponentId: data.player1_id,
            status: data.status,
            opponentName: '',
            avatarUrl: '',
            startDate: data.start_date,
            endDate: data.end_date,
            winner: data.winner,
            coins: data.coins
          });
        }
      });

      const battleData = await Promise.all(
        battles
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

      const pendingInData = await Promise.all(
        pendingInRequests
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

      const pendingOutData = await Promise.all(
        pendingOutRequests
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

      const completedGamesData = await Promise.all(
        completedGames
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


      const archivedGamesData = await Promise.all(
        archivedGames
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
      setPendingInRequests(pendingInData);
      setPendingOutRequests(pendingOutData);
      setCompletedGames(completedGamesData);
      setArchivedGames(archivedGamesData);

    } catch (err) {
      console.error("Error fetching battles:", err);
    }
  }

  const onViewProfile = (friendId: string) => {
    navigation.navigate('OtherProfiles', { userId: friendId });
  };


  const fetchCoins = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setAvailableCoins(data.coins || 0);
      }
    } catch (error) {
      console.error("Error fetching coins:", error);
      return 0;
    }
  }


  const viewRequest = async (battle: Battle) => {
    if (availableCoins <= 0) {
      setBrokeModal(true);
      return;
    } else {
      navigation.navigate('HabitConfig', { type: 'accept', battle: battle, });
    }
  }


  const declineRequest = async (battleId: string, opponentId: string) => {
    if (!user) return;
  
    const userRef = doc(db, 'users', opponentId);
    const battleRef = doc(db, 'games', battleId);
  
    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      const battleSnap = await transaction.get(battleRef);
  
      if (!userSnap.exists() || !battleSnap.exists()) {
        throw new Error("User or battle not found");
      }
  
      const currCoins = userSnap.data().coins || 0;
      const battleCoins = battleSnap.data().coins || 0;
  
      // Give coins back
      transaction.update(userRef, {
        coins: currCoins + battleCoins,
      });
  
      // Optionally mark the battle as declined
      transaction.update(battleRef, {
        status: 'declined',
      });
    });
  
    // Update UI after transaction
    setPendingInRequests(prevPending => 
      prevPending.filter(b => b.battleId !== battleId)
    );
  };
  


const handleStatus = async (battleId: string, status: string) => {
  if (!user) return;
  const ref = doc(db, 'games', battleId);
  const battleSnap = await getDoc(ref);
  const battle = battleSnap.data();

  if( !battle) return;

  if (battle.player1_id === user.uid) {
    await updateDoc(ref, {
      player1_status: status
    })
  } else {
    await updateDoc(ref, {
      player2_status: status
    })
  }

  setArchivedGames(prevPending => {
    const updatedPending = prevPending.filter(b => b.battleId !== battleId);
    return updatedPending;
  });
}

const newBattle = () => {
  if(availableCoins <= 0) {
    setBrokeModal(true);
    return;
  } else {
    navigation.navigate('OpponentSelection');}
}

const handlePin = async (battle: Completed) => {
  if (!user) return;
  handleStatus(battle.battleId, 'pinned');

  const batch = writeBatch(db);
  const q = query(
    collection(db, 'games', battle.battleId, 'submissions'),
    where('user_id', '==', user.uid)
  );

  const submissionsSnap = await getDocs(q);

  const pinnedGamesRef = doc(db, 'users', user.uid, 'pinned_games', battle.battleId);
  batch.set(pinnedGamesRef, {
    winner: battle.winner,
    opponent_id: battle.opponentId,
    opponent_name: battle.opponentName,
    opponent_avatar: battle.avatarUrl,
    start_date: battle.startDate,
    end_date: battle.endDate,
  });

  submissionsSnap.forEach(sub => {
    const pinnedSubRef = doc(db, 'users', user.uid, 'pinned_games', battle.battleId, 'submissions', sub.id);
    batch.set(pinnedSubRef, sub.data());
  });

  await batch.commit();
}

  return (
    <SafeAreaView>
      <Button 
      title="New Battle"
      onPress={newBattle}/>
      { pendingOutRequests.length > 0 && (
        <View>
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
                <Text style={{ color: '#666', marginRight: 10 }}>dare: {battle.users_dare}</Text>
                <Text style={{ color: '#666', marginRight: 10 }}>coins bet: {battle.coins}</Text>
                <Text style={{ color: '#666', marginRight: 10 }}>status: {battle.status}</Text>
                </View>
          ))}
        </ScrollView>
      </View>
    )}
    { pendingInRequests.length > 0 && (
      <View>
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
                <Text style={{ color: '#666', marginRight: 10 }}>coins bet: {battle.coins}</Text>
                  <TouchableOpacity onPress={() => viewRequest(battle)}>
                      <Text style={{ color: 'blue' }}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => declineRequest(battle.battleId, battle.opponentId)}>
                      <Text style={{ color: 'red' }}>Decline</Text>
                  </TouchableOpacity>
                </View>
          ))}
        </ScrollView>
      </View>
    )}
    { completedGames.length > 0 && (
      <View>
        <Text>Completed Games</Text>
        <ScrollView>
          {completedGames
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
                <Text>coins bet: {battle.coins}</Text>
                <Button title="Results" onPress={() => navigation.navigate('ResultScreen', { battle: battle })}/>
                </View>
          ))}
        </ScrollView>
      </View>
    )}
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
          <Text style={{ color: '#666', marginRight: 10 }}>coins bet: {battle.coins}</Text>
          <Button title="Battle" disabled={battle.allowSubmission} onPress={() => navigation.navigate('ResponseScreen', {battleId: battle.battleId, dare: battle.users_dare})}/>
          </View>
      ))}
  </ScrollView>
  { archivedGames.length > 0 && (
    <View>
    <Text>Archived Games</Text>
    <ScrollView>
      {archivedGames
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
              <TouchableOpacity onPress={() => handleStatus(battle.battleId, 'deleted')}>
                <Text style={{ color: 'red' }}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handlePin(battle)}>
                <Text style={{ color: 'blue' }}>Pin</Text>
              </TouchableOpacity>
            </View>
      ))}
    </ScrollView>
  </View>
  )}
      <Modal
      visible={brokeModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setBrokeModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ width: 300, padding: 20, backgroundColor: '#fff', borderRadius: 10 }}>
            <Text>Haha you're broke :P.</Text>
            <Button title="Get more coins"/>
            <Button title="Cancel" onPress={() => setBrokeModal(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
