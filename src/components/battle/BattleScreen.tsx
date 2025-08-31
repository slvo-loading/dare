import { SafeAreaView, View, Text, Button, ScrollView, 
  TouchableOpacity, Image, Modal, StyleSheet, Alert } from "react-native";
import { BattleStackProps } from "../../types";
import React, { use, useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../../firebaseConfig";
import { useFocusEffect } from '@react-navigation/native';
import PostView from '../battle/PostView';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  runTransaction,
  updateDoc,
  setDoc,
  deleteDoc,
  orderBy
} from 'firebase/firestore';

type Battle = 
{
  battleId: string;
  opponentId: string;
  opponentName: string,
  opponentUserName: string,
  avatarUrl: string,
  users_dare: string,
  status: string, 
  coins: number,
  allowSubmission: boolean,
}

type Selected = {
  id: string;
  dare: string;
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
  opponentUserName: string,
  users_dare: string;
}

export default function BattleScreen({ navigation }: BattleStackProps<'BattleScreen'>) {
  const { user } = useAuth();
  const [battleList, setBattleList] = useState<Battle[]>([]);
  const [pendingInRequests, setPendingInRequests] = useState<Battle[]>([]);
  const [pendingOutRequests, setPendingOutRequests] = useState<Battle[]>([]);
  const [completedGames, setCompletedGames] = useState<Completed[]>([]);
  const [archivedGames, setArchivedGames] = useState<Completed[]>([]);
  const [brokeModal, setBrokeModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Selected | null>(null);
  const [showSubmissions, setShowSubmissions] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // refetches everything everytime you change the screen ...hmmmm
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, fetching battles...');
      fetchBattles();
      setLoading(false);
    }, [])
  )

  const fetchBattles = async () => {
    let step = 0;
    if (!user) return;
    console.log(user)

    try {
      //get all the docs with the user
      const q = query(collection(db, "games"), where("users", "array-contains", user.uid), orderBy("start_date", "desc"));
      const playerSnap = await getDocs(q);

      // 2. Extract the other person’s ID in each case
      const battles: Battle[] = [];
      const pendingInRequests: Battle[] = [];
      const pendingOutRequests: Battle[] = [];
      const completedGames: Completed[] = [];
      const archivedGames: Completed[] = [];

      const now = new Date();
      const today = now.toISOString().split("T")[0];
    
  
      playerSnap.forEach(doc => {
        const data = doc.data();
        const player1 = data.player1_id === user.uid;

        const lastSubDate = data.player1_last_submission?.toDate().toISOString().split("T")[0] || null;
        let allowSubs;
        if (lastSubDate) {
          allowSubs = lastSubDate === today;
        } else {
          allowSubs = false;
        }

        if (data.status === 'active') {
          battles.push({
            battleId: doc.id,
            opponentId: player1 ? data.player2_id : data.player1_id,
            users_dare: player1 ? data.player2_dare : data.player1_dare,
            status: data.status,
            opponentName: '',
            opponentUserName: '',
            avatarUrl: '',
            coins: data.coins,
            allowSubmission: allowSubs,
          });
        } else if (data.status === 'pending' || data.status === 'declined') {
          if (player1) {
            pendingOutRequests.push({
              battleId: doc.id,
              opponentId: data.player2_id,
              users_dare: data.player2_dare,
              status: data.status,
              opponentName: '',
              opponentUserName: '',
              avatarUrl: '',
              coins: data.coins,
              allowSubmission: allowSubs,
            });
          } else {
            pendingInRequests.push({
              battleId: doc.id,
              opponentId: data.player1_id,
              users_dare: data.player1_dare,
              status: data.status,
              opponentName: '',
              avatarUrl: '',
              opponentUserName: '',
              coins: data.coins,
              allowSubmission: allowSubs,
            });
          }
        } else if (data.status === 'completed' && ((player1 && data.player1_status === 'archived') || (!player1 && data.player2_status === 'archived'))) {
          archivedGames.push({
            battleId: doc.id,
            opponentId: player1 ? data.player2_id : data.player1_id,
            users_dare: player1 ? data.player2_dare : data.player1_dare,
            status: data.status,
            opponentName: '',
            avatarUrl: '',
            startDate: data.start_date,
            endDate: data.end_date,
            winner: data.winner,
            coins: data.coins,
            opponentUserName: '',
          });
        } else if (data.status === 'completed' && ((player1 && !data.player1_status) || (!player1 && !data.player2_status))) {
            completedGames.push({
              battleId: doc.id,
              opponentId: player1? data.player2_id : data.player1_id,
              users_dare: player1? data.player2_dare : data.player1_dare,
              status: data.status,
              opponentName: '',
              avatarUrl: '',
              startDate: data.start_date,
              endDate: data.end_date,
              winner: data.winner,
              coins: data.coins,
              opponentUserName: '',
            });
        }
      });

      const battleData = await Promise.all(
        battles
        .filter((battle) => battle.opponentId)
        .map(async (battle) => {
          const opponentRef = doc(db, "users", battle.opponentId);
          const opponentSnap = await getDoc(opponentRef);
          const opponentData = opponentSnap.exists() ? opponentSnap.data() : null;

          return {
            ... battle,
            opponentUserName: opponentData?.username,
            avatarUrl: opponentData?.avatar_url,
            opponentName: opponentData?.name || opponentData?.username || 'User',
          }
        })
      )

      const pendingInData = await Promise.all(
        pendingInRequests
        .filter((battle) => battle.opponentId)
        .map(async (battle) => {
          const opponentRef = doc(db, "users", battle.opponentId);
          const opponentSnap = await getDoc(opponentRef);
          const opponentData = opponentSnap.exists() ? opponentSnap.data() : null;
          return {
            ... battle,
            opponentUserName: opponentData?.username,
            avatarUrl: opponentData?.avatar_url, 
            opponentName: opponentData?.name || opponentData?.username || 'User',
          }
        })
      )


      const pendingOutData = await Promise.all(
        pendingOutRequests
        .filter((battle) => battle.opponentId)
        .map(async (battle) => {
          const opponentRef = doc(db, "users", battle.opponentId);
          const opponentSnap = await getDoc(opponentRef);
          const opponentData = opponentSnap.exists() ? opponentSnap.data() : null;
          return {
            ... battle,
            opponentUserName: opponentData?.username,
            avatarUrl: opponentData?.avatar_url, 
            opponentName: opponentData?.name || opponentData?.username || 'User',
          }
        })
      )

      const completedGamesData = await Promise.all(
        completedGames
        .filter((battle) => battle.opponentId)
        .map(async (battle) => {
          const opponentRef = doc(db, "users", battle.opponentId);
          const opponentSnap = await getDoc(opponentRef);
          const opponentData = opponentSnap.exists() ? opponentSnap.data() : null;
          return {
            ... battle,
            opponentUserName: opponentData?.username,
            avatarUrl: opponentData?.avatar_url, 
            opponentName: opponentData?.name || opponentData?.username || 'User',
          }
        })
      )


      const archivedGamesData = await Promise.all(
        archivedGames
        .filter((battle) => battle.opponentId)
        .map(async (battle) => {
          const opponentRef = doc(db, "users", battle.opponentId);
          const opponentSnap = await getDoc(opponentRef);
          const opponentData = opponentSnap.exists() ? opponentSnap.data() : null;
          return {
            ... battle,
            opponentUserName: opponentData?.username,
            avatarUrl: opponentData?.avatar_url, 
            opponentName: opponentData?.name || opponentData?.username || 'User',
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


  // const fetchCoins = async () => {
  //   if (!user) return;
  //   try {
  //     const userDoc = await getDoc(doc(db, 'users', user.uid));
  //     if (userDoc.exists()) {
  //       const data = userDoc.data();
  //       setAvailableCoins(data.coins || 0);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching coins:", error);
  //     return 0;
  //   }
  // }


  // navs to the habit config page
  const viewRequest = async (battle: Battle) => {
    if (!user) return;
    if (user.coins <= 0) {
      setBrokeModal(true);
      return;
    } else {
      navigation.navigate('HabitConfig', { type: 'accept', battle: battle, });
    }
  }


  // when the user that has the outgoing request receives declined, they have to 'x' out the request to receive their coins again
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
  

  // sets to archive or pin or deleted once the game is done
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


  // navigates to opponent selection if the user has enough coins
  const newBattle = () => {
  if (!user) return;
    if(user.coins <= 0) {
      setBrokeModal(true);
      return;
    } else {
      navigation.navigate('OpponentSelection');}
  }


  // pins a game after it is complete
  const handlePin = async (battle: Completed) => {
    if (!user) return;
    handleStatus(battle.battleId, 'pinned');

    const pinnedGamesRef = doc(db, 'users', user.uid, 'pinned_games', battle.battleId);
    await setDoc(pinnedGamesRef, {
      winner: battle.winner,
      opponent_id: battle.opponentId,
      opponent_name: battle.opponentName,
      opponent_avatar: battle.avatarUrl,
      start_date: battle.startDate,
      end_date: battle.endDate,
    });

  }

  
  // deletes a game if it is declined by the invited user
  const deleteRequest = async (battleId: string) => {
    if (!user) return;
    const ref = doc(db, 'games', battleId);
    await deleteDoc(ref);

    setPendingOutRequests(prevPending => {
      const updatedPending = prevPending.filter(b => b.battleId !== battleId);
      return updatedPending;
    });
  }


  // sets the status of the game to declined
  const declineGameAlert = (battleId: string, opponentId: string) =>
    Alert.alert('Decline Request', `Are you sure you want to decline?`, [
      {
        text: 'Cancel', 
        style: 'cancel',
      },
      {text: 'Decline', onPress: () => declineRequest(battleId, opponentId)},
  ]);

 
  return (
    <SafeAreaView>
      <Button 
      title="New Game"
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
                {battle.status === 'declined' && (
                  <Button title="x" onPress={() => {deleteRequest(battle.battleId); (user && (user.coins = user.coins + battle.coins)); }}/>
                )}
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
                  <TouchableOpacity onPress={() => declineGameAlert(battle.battleId, battle.opponentId)}>
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
    <Text>Ongoing Games</Text>
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
          <View style={{flex: 1}}>
            <Text style={{ color: '#666', }}>Dare: {battle.users_dare}</Text>
            <Text style={{ color: '#666', }}>Coins: {battle.coins}</Text>
          </View>
          <Button title="View" onPress={() => {setSelectedGame({id: battle.battleId, dare: battle.users_dare}); setShowSubmissions(true)}}/>
          <Button title="Play" disabled={battle.allowSubmission} onPress={() => navigation.navigate('ResponseScreen', {battleId: battle.battleId, dare: battle.users_dare})}/>
          </View>
      ))}
  </ScrollView>

  <Modal
    animationType="slide"
    transparent={true}
    visible={showSubmissions && selectedGame !== null}
    onRequestClose={() => setShowSubmissions(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Button title="X" onPress={() => setShowSubmissions(false)} />
        <PostView battleId={selectedGame?.id || ''} dare={selectedGame?.dare || ''} type={'ongoing_game'} userId={user?.uid || ''}/>
      </View>
    </View>
  </Modal>

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