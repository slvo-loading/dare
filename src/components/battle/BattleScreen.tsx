import { SafeAreaView, View, Text, Button, ScrollView, TouchableOpacity, Image } from "react-native";
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
  deleteDoc, 
  setDoc, 
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

type Battle = 
{
  battleId: string;
  opponentId: string;
  updated_at: any;
  opponentName: string,
  avatarUrl: string,
  users_dare: string,
  status: string, 
  gameMode: string,
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
}

export default function BattleScreen({ navigation }: BattleStackProps<'BattleScreen'>) {
  const { user } = useAuth();
  const [battleList, setBattleList] = useState<Battle[]>([]);
  const [pendingInRequests, setPendingInRequests] = useState<Battle[]>([]);
  const [pendingOutRequests, setPendingOutRequests] = useState<Battle[]>([]);
  const [completedGames, setCompletedGames] = useState<Completed[]>([]);
  const [archivedGames, setArchivedGames] = useState<Completed[]>([]);
  const [loading, setLoading] = useState(true);

  // refetches everything everytime you change the screen ...hmmmm
  useFocusEffect(
    useCallback(() => {
      fetchBattles();
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
  
      player1Snap.forEach(doc => {
        const data = doc.data();
        if (data.status === 'active') {
          battles.push({
            battleId: doc.id,
            opponentId: data.player2_id,
            users_dare: data.player1_dare[0] || 'Waiting for dare',
            updated_at: data.updated_at,
            status: data.status,
            opponentName: '',
            avatarUrl: '',
            gameMode: data.game_mode
          });
        } else if (data.status === 'pending' || data.status === 'declined') {
          pendingOutRequests.push({
            battleId: doc.id,
            opponentId: data.player2_id,
            users_dare: data.player1_dare[0] || 'Waiting for dare',
            updated_at: data.updated_at,
            status: data.status,
            opponentName: '',
            avatarUrl: '',
            gameMode: data.game_mode
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
            winner: data.winner
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
            winner: data.winner
          });
        }
      });
  
      player2Snap.forEach(doc => {
        const data = doc.data();
        if (data.status === 'active') {
        battles.push({
          battleId: doc.id,
          opponentId: data.player1_id,
          users_dare: data.player1_dare[0] || 'Waiting for dare',
          updated_at: data.updated_at,
          status: data.status,
          opponentName: '',
          avatarUrl: '',
          gameMode: data.game_mode
        });
      } else if (data.status === 'pending') {
          pendingInRequests.push({
            battleId: doc.id,
            opponentId: data.player1_id,
            users_dare: data.player1_dare[0] || 'Waiting for dare',
            updated_at: data.updated_at,
            status: data.status,
            opponentName: '',
            avatarUrl: '',
            gameMode: data.game_mode
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
            winner: data.winner
          });
        }
        else if (data.status === 'completed' && data.player2_status === 'archived') {
          archivedGames.push({
            battleId: doc.id,
            opponentId: data.player2_id,
            status: data.status,
            opponentName: '',
            avatarUrl: '',
            startDate: data.start_date,
            endDate: data.end_date,
            winner: data.winner
          });
        }
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

      const pendingInData = await Promise.all(
        pendingInRequests
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

      const pendingOutData = await Promise.all(
        pendingOutRequests
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
      setPendingInRequests(pendingInData);
      setPendingOutRequests(pendingOutData);
      setCompletedGames(completedGames);
      setArchivedGames(archivedGames);

    } catch (err) {
      console.error("Error fetching battles:", err);
    }
  }

  const onViewProfile = (friendId: string) => {
    navigation.navigate('OtherProfiles', { userId: friendId });
  };


  // const fetchPendingInRequests = async () => {
  //   if (!user) return;

  //   try {
  //     const player2Query = query(collection(db, "games"), where("player2_id", "==", user.uid), where("status", "==", "pending"));
  
  //     const [player2Snap] = await Promise.all([
  //     getDocs(player2Query),
  //     ]);

  //     // 2. Extract the other person’s ID in each case
  //     const battles: Battle[] = [];
  
  //     player2Snap.forEach(doc => {
  //       const data = doc.data();
  //       battles.push({
  //         battleId: doc.id,
  //         opponentId: data.player1_id,
  //         users_dare: data.player1_dare[0] || 'Waiting for dare',
  //         updated_at: data.updated_at,
  //         status: data.status,
  //         opponentName: '',
  //         avatarUrl: '',
  //         gameMode: data.game_mode
  //       });
  //     });

  //     const battleData = await Promise.all(
  //       battles
  //       .sort((a, b) => {
  //         const aTime = a.updated_at?.toMillis?.() || 0;
  //         const bTime = b.updated_at?.toMillis?.() || 0;
  //         return bTime - aTime
  //       })
  //       .map(async (battle) => {
  //         const opponentRef = doc(db, "users", battle.opponentId);
  //         const opponentSnap = await getDoc(opponentRef);
  //         const opponentData = opponentSnap.exists() ? opponentSnap.data() : null;

  //         return {
  //           ... battle,
  //           opponentName: opponentData?.username,
  //           avatarUrl: opponentData?.avatar_url
  //         }
  //       })
  //     )

  //     setPendingInRequests(battleData);

  //   } catch (err) {
  //     console.error("Error fetching battles:", err);
  //   }
  // }

  const acceptRequest = async (battleId: string) => {

    const ref = doc(db, 'games', battleId);
    await updateDoc(ref, {
        status: 'active',
    });

    setPendingInRequests(prevPending => {
      const battleToMove = prevPending.find(b => b.battleId === battleId);
      if (!battleToMove) return prevPending; 

      const updatedPending = prevPending.filter(b => b.battleId !== battleId);


      setBattleList(prevBattles => [battleToMove, ...prevBattles]);

      return updatedPending;
    });
  };


  const declineRequest = async (battleId: string) => {
    const ref = doc(db, 'games', battleId);
    await updateDoc(ref, {
        status: 'declined',
    });

    setPendingInRequests(prevPending => {
      const updatedPending = prevPending.filter(b => b.battleId !== battleId);
      return updatedPending;
    });
  };

  // const fetchPendingOutRequests = async () => {
  //   if (!user) return;

  //   try {
  //     const player1Query = query(collection(db, "games"), where("player1_id", "==", user.uid), where("status", "in", ["pending", "declined"]));
  
  //     const [player1Snap] = await Promise.all([
  //     getDocs(player1Query),
  //     ]);

  //     // 2. Extract the other person’s ID in each case
  //     const battles: Battle[] = [];
  
  //     player1Snap.forEach(doc => {
  //       const data = doc.data();
  //       battles.push({
  //         battleId: doc.id,
  //         opponentId: data.player2_id,
  //         users_dare: data.player1_dare[0] || 'Waiting for dare',
  //         updated_at: data.updated_at,
  //         status: data.status,
  //         opponentName: '',
  //         avatarUrl: '',
  //         gameMode: data.game_mode
  //       });
  //     });

  //     const battleData = await Promise.all(
  //       battles
  //       .sort((a, b) => {
  //         const aTime = a.updated_at?.toMillis?.() || 0;
  //         const bTime = b.updated_at?.toMillis?.() || 0;
  //         return bTime - aTime
  //       })
  //       .map(async (battle) => {
  //         const opponentRef = doc(db, "users", battle.opponentId);
  //         const opponentSnap = await getDoc(opponentRef);
  //         const opponentData = opponentSnap.exists() ? opponentSnap.data() : null;

  //         return {
  //           ... battle,
  //           opponentName: opponentData?.username,
  //           avatarUrl: opponentData?.avatar_url
  //         }
  //       })
  //     )

  //     setPendingOutRequests(battleData);

  //   } catch (err) {
  //     console.error("Error fetching battles:", err);
  //   }
  // }

  const cancelRequest = async (battleId: string) => {
    console.log("Canceling request for battleId:", battleId);
    const ref = doc(db, 'games', battleId);
    await deleteDoc(ref);

    setPendingOutRequests(prevPending => {
      const updatedPending = prevPending.filter(b => b.battleId !== battleId);
      return updatedPending;
    });
    
    
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
      onPress={() => navigation.navigate('OpponentSelection')}/>
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
                <Text style={{ color: '#666', marginRight: 10 }}>dare sent: {battle.users_dare}</Text>
                <Text style={{ color: '#666', marginRight: 10 }}>status: {battle.status}</Text>
                <Button title="Delete" onPress={() => cancelRequest(battle.battleId)}/>
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
                  <TouchableOpacity onPress={() => acceptRequest(battle.battleId)}>
                      <Text style={{ color: 'blue' }}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => declineRequest(battle.battleId)}>
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
          <Button title="Battle" onPress={() => navigation.navigate("ResponseScreen", {battleId: battle.battleId, dare: battle.users_dare, gameMode: battle.gameMode})}/>
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
    </SafeAreaView>
  );
}
