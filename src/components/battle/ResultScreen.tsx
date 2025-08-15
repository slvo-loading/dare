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
      if (!user) return;
      handleStatus('pinned');
    
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