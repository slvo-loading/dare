import React, { useState } from "react";
import { View, Text, Button, SafeAreaView } from "react-native";
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
    runTransaction
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
    }
    
    const handlePin = async () => {
      let step = 0;
      if (!user) return;
      console.log(step++);//0
      handleStatus('pinned');
      console.log(step++);//1

      try {
        const batch = writeBatch(db);
        console.log(step++);//2
        const q = query(
          collection(db, 'games', battle.battleId, 'submissions'),
          where('user_id', '==', user.uid)
        );
        console.log(step++);//3
      
        const submissionsSnap = await getDocs(q);
        console.log(step++);//4
      
        const pinnedGamesRef = doc(db, 'users', user.uid, 'pinned_games', battle.battleId);
        batch.set(pinnedGamesRef, {
          winner: battle.winner,
          opponent_avatar: battle.avatarUrl,
          dare: battle.users_dare,
          opponent_id: battle.opponentId,
        });
        console.log(step++);
      
        submissionsSnap.forEach(sub => {
          const pinnedSubRef = doc(db, 'users', user.uid, 'pinned_games', battle.battleId, 'submissions', sub.id);
          batch.set(pinnedSubRef, sub.data());
        });
        console.log(step++);
      
        await batch.commit();
        console.log(step++);

      } catch (error) {
        console.error("Error pinning game:", error);
      }
    }

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
            claimCoins();
            navigation.reset({
                index: 0,
                routes: [{ name: "BattleScreen" }],
              });
        }}/>
        <Button title="Archive" onPress={() => {
            handleStatus('archived');
            claimCoins();
            navigation.reset({
                index: 0,
                routes: [{ name: "BattleScreen" }],
              });
        }}/>
        <Button title="Pin to Profile" onPress={() => {
            handlePin();
            claimCoins();
            navigation.reset({
                index: 0,
                routes: [{ name: "BattleScreen" }],
              });
        }}/>
    </SafeAreaView>
  );
}