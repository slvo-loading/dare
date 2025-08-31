import { View, SafeAreaView, Text, Button, ActivityIndicator, Modal, StyleSheet, TextInput, Alert} from "react-native";
import { BattleStackProps } from "../../types";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {io, Socket } from 'socket.io-client';
import { useRoute, RouteProp } from '@react-navigation/native';
import { collection, doc, addDoc, Timestamp, runTransaction } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';
import { Dropdown } from "react-native-element-dropdown";
import { useAuth } from '../../context/AuthContext';

type MatchData = {
  opponentName: string;
  opponentId: string;
  avatarUrl: string;
  opponentUserName: string;
  name: string;
  dare: string;
  coins: number;
  isHost: boolean;
}

type Dare = {
  userId: string;
  userName: string;
  avatarUrl: string;
  dare: string;
  coins: number;
  name: string
}

const reportReasons = [
  { label: "Cheating / Exploiting", value: "cheating" },
  { label: "Harassment / Abusive Language", value: "harassment" },
  { label: "Inappropriate Profile / Content", value: "inappropriate" },
  { label: "AFK / Intentionally Losing", value: "afk" },
  { label: "Other", value: "other" },
];

export default function MatchmakingScreen({ navigation, route }: BattleStackProps<'Matchmaking'>) {
  const {user} = useAuth();
  const dare = route.params.dare; 

  const [status, setStatus] = useState('Looking for match...');
  const [match, setMatch] = useState<MatchData | null>(null);
  const [countdown, setCountdown] = useState<number>(60); // Example countdown duration
  const [opponentAccepted, setOpponentAccepted] = useState<boolean>(false);
  const [accepted, setAccepted] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const socket = useRef<Socket | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const matchRef = useRef<MatchData | null>(null);
  const [reportedUser, setReportedUser] = useState<boolean>(false);
  const [details, setDetails] = useState<string>('');
  const opponentReportedRef = useRef(false);

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
      if (opponentReportedRef.current || reportedUser) {
        console.log("opponenet reported you, can't requeue");
        handleReportedUser();
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
            player1: dare, 
            player2: currentMatch, 
          })
          console.log("Game created successfully")
        }
    
        navigation.navigate('GameStart', { 
          type: 'match', 
          match: {
            opponentName: currentMatch.opponentName,
            opponentId: currentMatch.opponentId,
            dare: currentMatch.dare,
            opponentUserName: currentMatch.opponentUserName,
            opponentAvatar: currentMatch.avatarUrl,
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
            if (socket.current && !accepted) {
              console.log("user did not accept match, and was not reported, requeuing");
              socket.current.emit('match_timeout')
            } 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [match, accepted, opponentAccepted]);

  const handleReportedUser = () => {
    if (!user || !match) return;
    user.coins = user.coins - match.coins;

    console.log("Handling reported user");
    if (socket.current) {
      socket.current.emit('disconnect')
    }

    Alert.alert(
      'You have been reported',
      'This report can be found in your Settings under Reports.',
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
    console.log("Submitting report...");
    if (!match || !user) return;
  
    const reporterRef = doc(db, "users", dare.userId);
    const reportedRef = doc(db, "users", match.opponentId);
  
    try {
      await runTransaction(db, async (transaction) => {
        // Get current balances
        const reporterSnap = await transaction.get(reporterRef);
        const reportedSnap = await transaction.get(reportedRef);
  
        if (!reporterSnap.exists()) throw new Error("Reporter not found");
        if (!reportedSnap.exists()) throw new Error("Reported user not found");
  
        const reporterData = reporterSnap.data();
        const reportedData = reportedSnap.data();
  
        const reportsRef = collection(db, "reports");
        transaction.set(doc(reportsRef), {
          reporter_data: {
            id: dare.userId,
            coins: reporterData.coins * 0.1,
          },
          reported_data: {
            id: match.opponentId,
            coins: reportedData.coins * 0.1,
          },
          source: {
            type: "matchmaking dare",
            source: match.dare,
          },
          reason: selectedReason,
          reporter_details: details,
          reported_details: '',
          users: [dare.userId, match.opponentId],
          status: "pending",
          created_at: Timestamp.now(),
        });

        // Deduct coins from reporter
        transaction.update(reporterRef, {
          coins: reporterData.coins * 0.9, // Deduct 10% fee
        });
  
        transaction.update(reportedRef, {
          coins: reportedData.coins * 0.9, // Deduct 10% fee
        });
      });

  
      user.coins = user.coins - dare.coins;
  
      // Emit to other player
      if (socket.current) {
        socket.current.emit("reported");
      }
  
      // Success alert
      Alert.alert(
        "Quick report submitted!",
        "To prevent false reports, we will hold the coins from this match. Coins will be refunded if your report is valid.",
        [{ text: "Close", style: "default", onPress: () => setShowReportModal(false) }]
      );
  
      // Reset modal fields
      setReportedUser(true);
      setSelectedReason(null);
  
    } catch (err: any) {
      console.error("Error submitting report:", err);
      Alert.alert("Error", err.message || "Something went wrong. Please try again.");
    }
  };
  

  const createGame = async ({ player1, player2} 
    : {player2: MatchData, player1: Dare, }) => {
        
  if (!user) return;

    await runTransaction(db, async (transaction) => {
      const p1Ref = doc(db, "users", player1.userId);
      const p2Ref = doc(db, "users", player2.opponentId);

      const p1Snap = await transaction.get(p1Ref);
      const p2Snap = await transaction.get(p2Ref);

      if (!p1Snap.exists() || !p2Snap.exists()) {
        throw new Error("One or both players not found");
      }

      const p1Coins = p1Snap.data().coins || 0;
      const p2Coins = p2Snap.data().coins || 0;

      if (p1Coins < player1.coins || p2Coins < player2.coins) {
        throw new Error("One or both players do not have enough coins");
      }

      transaction.update(p1Ref, { coins: p1Coins - player1.coins });
      transaction.update(p2Ref, { coins: p2Coins - player2.coins });

      const gameRef = doc(collection(db, "games"));
      transaction.set(gameRef, {
        player1_id: player1.userId,
        player2_id: player2.opponentId,
        users: [player1.userId, player2.opponentId],
        player1_dare: player1.dare,
        player2_dare: player2.dare,
        status: 'active',
        coins: player1.coins + player2.coins,
        start_date: Timestamp.now(),
      });

      user.coins = user.coins - player1.coins;
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

                <Dropdown
                  style={styles.dropdown}
                  data={reportReasons}
                  labelField="label"
                  valueField="value"
                  placeholder="Select a reason"
                  value={selectedReason}
                  onChange={(item : any) => setSelectedReason(item.value)}
                />

                <TextInput
                  value={details}
                  onChangeText={setDetails}
                  placeholder="Enter details about the report (optional). You can only enter details once. If you choose not to enter them now, you can add them later in Settings > Reports."
                  maxLength={200}
                  style={{
                    borderWidth: 1,
                    borderColor: '#ccc',
                    padding: 12,
                    marginBottom: 12,
                  }}
                />
                <Text>{details.length}/200</Text>

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