
import { BattleStackProps, } from "../../types";
import React, { useState, useEffect } from "react";
import { View, SafeAreaView, TextInput, Button, 
  Text, Modal, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from "../../../firebaseConfig";
import { doc, getDoc, runTransaction, Timestamp } from "firebase/firestore";
import Slider from '@react-native-community/slider';

export default function HabitConfigScreen({ navigation, route }: BattleStackProps<'HabitConfig'>) {
  const { type, battle } = route.params;
  const [dare, setDare] = useState<string>('');
  const { user } = useAuth();
  const [betCoins, setBetCoins] = useState<number>(1);
  const [availableCoins, setAvailableCoins] = useState<number>(0);
  const [showModal, setShowModal] = useState<boolean>(true);


  useEffect(() => {
    fetchCoins();
  }, [battle?.battleId]);

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


  const acceptInvite = async () => {
      let step = 0
      if (!user || !battle) return;
    
      const userRef = doc(db, "users", user.uid);
      const battleRef = doc(db, 'games', battle.battleId);
    
      await runTransaction(db, async (transaction) => {
        // Get fresh user data
        try {
          const userSnap = await transaction.get(userRef);
          const battleSnap = await transaction.get(battleRef);

          if (!userSnap.exists() || !battleSnap.exists()) throw new Error("User or battle does not exist");
      
          const userCoins = userSnap.data().coins || 0;
          const battleCoins = battleSnap.data().coins || 0;
      
          // Check balance
          if (userCoins < betCoins) {
            throw new Error("Not enough coins to send invite");
          }
      
          // Deduct coins
          transaction.update(userRef, {
            coins: userCoins - betCoins,
          });

          transaction.update(battleRef, {
            status: 'active',
            coins: battleCoins + betCoins,
            player2_dare: dare,
            start_date: Timestamp.now()
          })

        // Navigate after transaction is committed
          navigation.navigate("GameStart", { 
            type: "accept", 
            match: {
              opponentName: battle.opponentName,
              opponentId: battle.opponentId,
              dare: battle.users_dare,
            }
          });

        } catch (error) {
          console.error("Transaction failed:", error);
        }
    });
  }

  const onViewProfile = (friendId: any) => {
    navigation.navigate('OtherProfiles', { userId: friendId });
  };


  return (
    <SafeAreaView style={{ padding: 16 }}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Rules:</Text>
            <Text style={styles.modalText}>1. Keep it clean — no harmful or explicit content.</Text>
            <Text style={styles.modalText}>2. Longest streak without missing wins.</Text>
            <Text style={styles.modalText}>3. Play fair, stay respectful.</Text>
            <Button title="Close" onPress={() => setShowModal(false)} />
          </View>
        </View>
      </Modal>

        {type === 'accept' && (
          <View key={battle?.battleId} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <TouchableOpacity onPress={() => onViewProfile(battle?.opponentId)}>
                <Image
                source={{ uri: battle?.avatarUrl }}
                style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
                />
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => onViewProfile(battle?.opponentId)}>
                <Text style={{ fontWeight: 'bold' }}>{battle?.opponentName}</Text>
                <Text style={{ color: '#666' }}>{battle?.opponentName}</Text>
            </TouchableOpacity>
            <Text style={{ color: '#666', marginRight: 10 }}>{battle?.users_dare}</Text>
            <Text style={{ color: '#666', marginRight: 10 }}>coins bet: {battle?.coins}</Text>
          </View>
        )}

        <Text>I dare you to ...</Text>
        <TextInput
          value={dare}
          onChangeText={setDare}
          placeholder="Enter your dare"
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 12,
            marginBottom: 12,
          }}
        />

        <Text></Text>
        <Text>You have {availableCoins} coins. How much will you bet?</Text>
        <Text>bet coins: {betCoins}</Text>
        <Slider
          minimumValue={1}
          maximumValue={availableCoins}
          step={10}
          value={betCoins}
          onValueChange={setBetCoins}
        />
        <Text>Winner takes the pot 🤑</Text>

        <Text></Text>
        {type === 'friend_requests' ? (
          <Button title="Submit" 
          onPress={() => navigation.navigate('InviteFriend', { dare: dare, coins: betCoins })} />
        ) : type === 'matchmaking' ? (
          user ? ( // Check if user is not null
            <Button 
              title="Submit" 
              onPress={() => navigation.navigate('Matchmaking', { 
                dare: {
                  userName: user.userName || 'user',
                  userId: user.uid,
                  dare: dare,
                  coins: betCoins,
                },
              })} 
            />
          ) : (
            <Text>Please log in to submit a dare.</Text> // Fallback if user is null
          )
        ) : (
            <Button title="Next" onPress={acceptInvite}/>
        )}
    </SafeAreaView>
  )}

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
  });