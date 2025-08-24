import { View, SafeAreaView, Text, Button, ActivityIndicator, Modal, StyleSheet, TextInput, Alert} from "react-native";
import { BattleStackProps } from "../../types";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {io, Socket } from 'socket.io-client';
import { useRoute, RouteProp } from '@react-navigation/native';
import { collection, doc, addDoc, Timestamp, runTransaction } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';
import { Dropdown } from "react-native-element-dropdown";
import Slider from '@react-native-community/slider';

type MatchData = {
  opponentName: string;
  opponentId: string;
  dare: string;
  coins: number;
  isHost: boolean;
}

type MatchmakingScreenRouteProp = RouteProp<
  { Matchmaking: { dare: { userName: string, userId: string, dare: string, coins: number} } },
  'Matchmaking'
>;

const reportReasons = [
  { label: "Cheating / Exploiting", value: "cheating" },
  { label: "Harassment / Abusive Language", value: "harassment" },
  { label: "Inappropriate Profile / Content", value: "inappropriate" },
  { label: "AFK / Intentionally Losing", value: "afk" },
  { label: "Other", value: "other" },
];

export default function MatchmakingScreen({ navigation }: BattleStackProps<'Matchmaking'>) {
  const route = useRoute<MatchmakingScreenRouteProp>();
  const [dare, setDare] = useState(route.params.dare); 

  const [status, setStatus] = useState('Looking for match...');
  const [match, setMatch] = useState<MatchData | null>(null);
  const [countdown, setCountdown] = useState<number>(60); // Example countdown duration
  const [opponentAccepted, setOpponentAccepted] = useState<boolean>(false);
  const [accepted, setAccepted] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState<string>("");
  const socket = useRef<Socket | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const matchRef = useRef<MatchData | null>(null);
  const [reportedUser, setReportedUser] = useState<boolean>(false);
  const opponentReportedRef = useRef(false);
  const [severity, setSeverity] = useState<number>(1); 

  useEffect(() => {
    matchRef.current = match;
    console.log('Match updated in ref:', match);
  }, [match]);

useFocusEffect(
  useCallback(() => {
    
    socket.current = io("http://192.168.1.163:4000", {
      transports: ["websocket"], // Force WebSocket to avoid polling issues
    });
    const socketClient = socket.current;
    socketClient.emit('enqueue', { dare });
  
    // Listen for a match
    socketClient.on('match_found', (response) => {
      
      setMatch(response.data);
      setCountdown(60);
      setStatus('Match found!');
    });
  
    socketClient.on('match_timeout', () => {
      console.log('Match timed out');
    });
  
    socketClient.on('requeue', () => {
      if (opponentReportedRef.current) {
        console.log("opponenet reported you, can't requeue");
        return;
      }

      console.log('Requeueing...');
      socketClient.emit('enqueue', { dare });
      opponentReportedRef.current = false;
      setReportedUser(false);
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

    socketClient.on('opponent_reported', () => {
      console.log('Opponent reported you');
      opponentReportedRef.current = true;
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
            dareFromPlayer2: dare.dare,
            player1Coins: currentMatch.coins,
            player2Coins: dare.coins
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
  }, []),
  );


  useEffect(() => {
    if (match && countdown > 0 && !(accepted && opponentAccepted)) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1 || (accepted && opponentAccepted)) {
            clearInterval(timer);
            if (socket.current && !accepted && !opponentReportedRef.current) {
              console.log("user did not accept match, and was not reported, requeuing");
              socket.current.emit('match_timeout')
            } else if (opponentReportedRef.current) {
              console.log("opponent reported you, handling reported user");
              handleReportedUser();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setShowReportModal(false);
      return () => clearInterval(timer);
    }
  }, [match, accepted, opponentAccepted]);

  const handleReportedUser = () => {
    console.log("Handling reported user");
    if (socket.current) {
      socket.current.disconnect(); // Explicitly disconnect the user from the socket
    }
    Alert.alert(
      'You have been reported',
      'Details about the report can be found in your Settings under Reports.',
      [{ text: 'OK', onPress: () => navigation.reset({
          index: 0,
          routes: [{ name: "BattleScreen" }],
        })
      }]
    );
  } 
  

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

  const reportUser = async () => {
    console.log("submitting report")
    if(!match) return;

    try {
      // 1️⃣ Save report to Firebase
      console.log("Saving report to Firebase");
      const ref = collection(db, 'reports');
      await addDoc(ref, {
        reporter_id: dare.userId,
        reported_id: match.opponentId,
        reason: selectedReason,
        details: details || '',
        severity: severity,
        timestamp: Timestamp.now(),
        status: 'pending',
      })

      console.log("Report saved successfully");
  
      // 2️⃣ Emit to the other player via Socket.IO
      if (socket.current) {
        socket.current.emit('reported');
      }

      console.log("Report emitted to socket");
  
      // 3️⃣ Show success alert
      Alert.alert(
        'Quick report submitted!',
        'You can provide additional details anytime on the Reports page in your Settings. You will be requeued when the countdown ends.',
        [{ text: 'Close', style: 'default', onPress: () => setShowReportModal(false) }]
      );
  
      // Reset modal fields
      setReportedUser(true);
      setSelectedReason(null);
      setDetails('');
  
    } catch (err) {
      console.error('Error submitting report:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };
  

  const createGame = async ({ player1Id, player2Id, dareFromPlayer1, dareFromPlayer2, player1Coins, player2Coins} 
    : {player1Id:string, player2Id: string, dareFromPlayer1: string, dareFromPlayer2: string, 
      player1Coins: number, player2Coins: number}) => {

    await runTransaction(db, async (transaction) => {
      const p1Ref = doc(db, "users", player1Id);
      const p2Ref = doc(db, "users", player2Id);

      const p1Snap = await transaction.get(p1Ref);
      const p2Snap = await transaction.get(p2Ref);

      if (!p1Snap.exists() || !p2Snap.exists()) {
        throw new Error("One or both players not found");
      }

      const p1Coins = p1Snap.data().coins || 0;
      const p2Coins = p2Snap.data().coins || 0;

      if (p1Coins < player1Coins || p2Coins < player2Coins) {
        throw new Error("One or both players do not have enough coins");
      }

      transaction.update(p1Ref, { coins: p1Coins - player1Coins });
      transaction.update(p2Ref, { coins: p2Coins - player2Coins });

      const gameRef = doc(collection(db, "games"));
      transaction.set(gameRef, {
        player1_id: player1Id,
        player2_id: player2Id,
        player1_dare: dareFromPlayer1,
        player2_dare: dareFromPlayer2,
        status: 'active',
        coins: player1Coins + player2Coins,
        start_date: Timestamp.now(),
      });
    })
  }

  useEffect(() => {
    console.log('match:', match);
  }, [match])

  return (
    <SafeAreaView>
      {match ? (
        <View>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            Match found with {match.opponentName}!
          </Text>
          <Text style={{ marginBottom: 20 }}>
            Dare: {match.dare}
          </Text>
          <Text style={{ marginBottom: 20 }}>
            for {match.coins} coins :D
          </Text>
          <Text style={{ marginBottom: 20 }}>
            Starting in {countdown} seconds...
          </Text>
          <Text style={{ marginBottom: 20 }}>
            Opponent Accepted?: {opponentAccepted ? 'Yes' : 'No'}
          </Text>
          <Text>Reported by other user?{opponentReportedRef.current ? 'Yes' : 'No'}</Text>
          { accepted ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <Button title="Accept" onPress={acceptMatch} />
            <Button title="Decline" onPress={declineMatch} />
            <Button title="Report" disabled={reportedUser} onPress={() => {setShowReportModal(true); console.log("opened modal")}} />
          </View>
          )}

          <Modal
            animationType="slide"
            transparent={true}
            visible={showReportModal}
            onRequestClose={() => setShowReportModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Quick Report</Text>
                <Text style={styles.modalText}>Help us keep the community safe and enjoyable by reporting inappropriate behavior. False reports may result in penalties.</Text>

                <Text style={styles.modalText}>You have {countdown} seconds before the match requeues.</Text>

                <Dropdown
                  style={styles.dropdown}
                  data={reportReasons}
                  labelField="label"
                  valueField="value"
                  placeholder="Select a reason"
                  value={selectedReason}
                  onChange={(item) => setSelectedReason(item.value)}
                />

                <Text style={styles.modalText}>Severity: {severity} </Text>
                <Slider
                  minimumValue={1}
                  maximumValue={5}
                  step={1}
                  value={severity}
                  onValueChange={setSeverity}
                />

                <TextInput
                  style={styles.textInput}
                  placeholder="Additional details (optional)"
                  multiline
                  maxLength={300}
                  value={details}
                  onChangeText={setDetails}
                />
                <Text style={styles.modalText}>{details.length}/300</Text>

                <Button title="Cancel" onPress={() => setShowReportModal(false)} />
                <Button title="Submit Report" onPress={reportUser}/>
              </View>
            </View>
          </Modal>

        </View>
      ) : (
        <>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={{ marginTop: 16 }}>{status}</Text>
        </>
      )}
    </SafeAreaView>
  );
}


  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '80%',
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
    dropdown: {
      height: 50,
      width: '100%', // Set the dropdown to take the full width of its parent
      maxWidth: 300, // Optional: Set a maximum width for the dropdown
      borderColor: "#ccc",
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 15,
      alignSelf: "center", // Center the dropdown within its parent
    },
    textInput: {
      height: 80,
      borderColor: "#ccc",
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      marginBottom: 15,
      textAlignVertical: "top",
    },
  
  });