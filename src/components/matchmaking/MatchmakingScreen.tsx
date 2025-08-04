import { View, Text, Button, ActivityIndicator} from "react-native";
import { BattleStackProps } from "../../types";
import React, { useState, useEffect, useRef } from "react";
import {io, Socket } from 'socket.io-client';
import { useRoute, RouteProp } from '@react-navigation/native';
import { collection, doc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

type MatchData = {
  opponentName: string;
  opponentId: string;
  dare: string;
  isHost: boolean;
}

type MatchmakingScreenRouteProp = RouteProp<
  { Matchmaking: { dare: { userName: string, userId: string, dare: string} } },
  'Matchmaking'
>;

export default function MatchmakingScreen({ navigation }: BattleStackProps<'Matchmaking'>) {
  const route = useRoute<MatchmakingScreenRouteProp>();
  const [dare, setDare] = useState(route.params.dare);

  const [status, setStatus] = useState('Looking for match...');
  const [match, setMatch] = useState<MatchData | null>(null);
  const [countdown, setCountdown] = useState(30); // Example countdown duration
  const [opponentAccepted, setOpponentAccepted] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const socket = useRef<Socket | null>(null);
  const matchRef = useRef<MatchData | null>(null);

  useEffect(() => {
    matchRef.current = match;
    console.log('Match updated in ref:', match);
  }, [match]);


  useEffect(() => {
    socket.current = io('http://localhost:3001');
    const socketClient = socket.current;
    socketClient.emit('enqueue', { dare });
  
    // Listen for a match
    socketClient.on('match_found', (response) => {
      
      setMatch(response.data);
      setCountdown(10);
      setStatus('Match found!');
    });
  
    socketClient.on('match_timeout', () => {
      console.log('Match timed out');
    });
  
    socketClient.on('requeue', () => {
      console.log('Requeueing...');
      socketClient.emit('enqueue', { dare });
      setOpponentAccepted(false);
      setMatch(null);
      setStatus('Looking for match...');
      setCountdown(0);
      setAccepted(false);
      setOpponentAccepted(false);
    });

    socketClient.on('opponent_accepted', () => {
      console.log('Opponent accepted the match');
      setOpponentAccepted(true);
    });

    socketClient.on('opponent_declined', () => {
      socketClient.emit('decline_match');
    });

    socketClient.on('start_game', async (response) => {
      console.log('Starting game...');
      
      const currentMatch = matchRef.current;
      if (!currentMatch) {
        console.error('No match data available for game start');
        return;
      }

      // setCountdown(0);

      try {
        if (currentMatch.isHost) {
          console.log("creating game with:", {
            player1Id: dare.userId,
            player2Id: currentMatch.opponentId,
            dareFromPlayer1: dare.dare,
            dareFromPlayer2: currentMatch.dare
          });
          createGame({ 
            player1Id: currentMatch.opponentId, 
            player2Id: dare.userId, 
            dareFromPlayer1: currentMatch.dare,
            dareFromPlayer2: dare.dare
          })
          console.log("Game created successfully")
        }
    
        navigation.navigate('GameStart', { 
          type: 'match', 
          match: {
            opponentName: currentMatch.opponentName,
            opponentId: currentMatch.opponentId,
            dare: currentMatch.dare
          }
        });
     } catch (error) {
       console.error('Error creating game:', error);
     }
    });
  
    // Clean up function
    return () => {
      socketClient.off('match_found');
      socketClient.off('match_timeout');
      socketClient.off('requeue');
      socketClient.off('opponent_accepted');
      socketClient.off('opponent_declined');
      socketClient.off('start_game_host');
      socketClient.off('start_game');
      socketClient.disconnect();
    };
  }, [dare]);


  useEffect(() => {
    if (match && countdown > 0 && !(accepted && opponentAccepted)) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1 || (accepted && opponentAccepted)) {
            clearInterval(timer);
            if (socket.current && !accepted) socket.current.emit('match_timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [match, accepted, opponentAccepted]);
  

  const acceptMatch = () => {
    if (socket.current) {
      socket.current.emit('accept_match');
    }
    setAccepted(true);
  };

  const declineMatch = () => {
    if (socket.current) {
      socket.current.emit('decline_match');
    }
  };

  const createGame = async ({ player1Id, player2Id, dareFromPlayer1, dareFromPlayer2 } 
    : {player1Id:string, player2Id: string, dareFromPlayer1: string, dareFromPlayer2: string}) => {
    console.log("Creating game with:", { player1Id, player2Id, dareFromPlayer1, dareFromPlayer2 });
    
    await addDoc(collection(db, "games"), {
      player1_id: player1Id,
      player2_id: player2Id,
      player1_dare: dareFromPlayer1,
      player2_dare: dareFromPlayer2,
      status: 'active',
      start_date: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
  };

  useEffect(() => {
    console.log('match:', match);
  }, [match])

  return (
    <View>
      {match ? (
        <View>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            Match found with {match.opponentName}!
          </Text>
          <Text style={{ marginBottom: 20 }}>
            Dare: {match.dare}
          </Text>
          <Text style={{ marginBottom: 20 }}>
            Starting in {countdown} seconds...
          </Text>
          <Text style={{ marginBottom: 20 }}>
            Opponent Accepted?: {opponentAccepted ? 'Yes' : 'No'}
          </Text>
          { accepted ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <Button title="Accept" onPress={acceptMatch} />
            <Button title="Decline" onPress={declineMatch} />
          </View>
          )}
        </View>
      ) : (
        <>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={{ marginTop: 16 }}>{status}</Text>
        </>
      )}
    </View>
  );
}