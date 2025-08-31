import React, { useState } from "react";
import { View, Text, Button, SafeAreaView, Alert } from "react-native";
import { BattleStackProps } from "../../types";
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
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
    writeBatch,
    runTransaction,
    orderBy
  } from 'firebase/firestore';

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
  users_dare: string,
}

type ResultRouteParams = {
  battle: Completed;
};

type ResultRouteProp = RouteProp<
  { ResultScreen: ResultRouteParams },
  'ResultScreen'
>;

export default function ResultScreen({ navigation }: BattleStackProps<'ResultScreen'>) {
    const route = useRoute<ResultRouteProp>();
    const [battle, setBattle] = useState<Completed>(route.params.battle);
    const { user } = useAuth();

    const handleStatus = async (status: string) => {
      if (!user) return;
      const ref = doc(db, 'games', battle.battleId);
      const battleSnap = await getDoc(ref);
      const data = battleSnap.data();
    
      if( !data) return;
    
      if (data.player1_id === user.uid) {
        await updateDoc(ref, {
          player1_status: status
        })
      } else {
        await updateDoc(ref, {
          player2_status: status
        })
      }

      claimCoins();
    }
    
    const handlePin = async () => {
      let step = 0;
      if (!user) return;

      try {
        const batch = writeBatch(db);
        console.log(step++);//2
        const q = query(
          collection(db, 'games', battle.battleId, 'submissions'),
          where('user_id', '==', user.uid),
          orderBy('submitted_at', 'desc')
        );
      
        const submissionsSnap = await getDocs(q);
        if (submissionsSnap.empty) {
          unableToPin();
          return;
        }
        
        let thumbnail: string | null = null;
      
        submissionsSnap.forEach(sub => {
          const pinnedSubRef = doc(db, 'users', user.uid, 'pinned_games', battle.battleId, 'submissions', sub.id);
          if (!thumbnail) {
            thumbnail = sub.data().media[0]?.uri;
          }
          const subData = sub.data();
          batch.set(pinnedSubRef, {
            caption: subData.caption,
            media: subData.media,
            submitted_at: subData.submitted_at,
          }
          );
        });

        const pinnedGamesRef = doc(db, 'users', user.uid, 'pinned_games', battle.battleId);
        batch.set(pinnedGamesRef, {
          winner: battle.winner,
          thumbnail: battle.avatarUrl,
          title: battle.users_dare,
          opponent_id: battle.opponentId,
        });

        handleStatus('pinned');
        await batch.commit();

      } catch (error) {
        console.error("Error pinning game:", error);
      }
    }

    const unableToPin = () =>
      Alert.alert('Unable to Pin', 'You didn\'t submit any photos for this game. Please delete or archive the game instead.', [
        {
          text: 'Delete',
          onPress: () => {
            handleStatus('deleted');
            navigation.reset({
                index: 0,
                routes: [{ name: "BattleScreen" }],
              });
          }
        },
        {
          text: 'Archive', 
          onPress: () => {
            handleStatus('archived');
            navigation.reset({
                index: 0,
                routes: [{ name: "BattleScreen" }],
              });
            }
        },
      ]);

    const claimCoins = async () => {
        if (!user) return;

        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'games', battle.battleId);
            const gameSnap = await transaction.get(gameRef);

            if (!gameSnap.exists()) {
                throw new Error("Game not found");
            }

            const gameData = gameSnap.data();

            if (gameData.winner !== user.uid) {
                throw new Error("You are not the winner of this game");
            }

            const coins = gameData.coins || 0;
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await transaction.get(userRef);

            if (!userSnap.exists()) {
                throw new Error("User not found");
            }

            const currCoins = userSnap.data().coins;

            transaction.update(userRef, {
                coins: currCoins + coins
            });

            user.coins = currCoins + coins;
        })
    }

  return (
    <SafeAreaView>
        {battle.winner === user?.uid ? (
            <Text>You won!</Text>
        ) : (
            <Text>You lost :/</Text>
        )}
        <Button title="Delete" onPress={() => {
            handleStatus('deleted');
            navigation.reset({
                index: 0,
                routes: [{ name: "BattleScreen" }],
              });
        }}/>
        <Button title="Archive" onPress={() => {
            handleStatus('archived');
            navigation.reset({
                index: 0,
                routes: [{ name: "BattleScreen" }],
              });
        }}/>
        <Button title="Pin to Profile" onPress={() => {
            handlePin();
            navigation.reset({
                index: 0,
                routes: [{ name: "BattleScreen" }],
              });
        }}/>
    </SafeAreaView>
  );
}