
import { BattleStackProps } from "../../types";
import React, { useState } from "react";
import { View, TextInput, Button, Alert, Text } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRoute, RouteProp } from '@react-navigation/native';

type HabitConfigRouteParams = {
  type: string;
  opponentId: string;
};

type GameStartRouteProp = RouteProp<
  { GameStart: HabitConfigRouteParams },
  'GameStart'
>;


export default function HabitConfigScreen({ navigation }: BattleStackProps<'HabitConfig'>) {
  const route = useRoute<GameStartRouteProp>();
  const { type } = route.params;
  const [dare, setDare] = useState<string>('');
  const [gameMode, setGameMode] = useState<string>('');
  const { user } = useAuth();
  

  return (
    <View style={{ padding: 16 }}>
      <Text>Rules: (make this into a modal)</Text>
      <Text>1. Keep it Clean: No inappropriate, violent, or harmful dares. Be respectful and kind!
        2. Streak = Strength: Whoever keeps their streak the longest without skipping a dare wins!
        3. Have Fun: Be silly, be brave, and enjoy the chaos 💥</Text>
      <Button title="Select Survival Mode" onPress={() => setGameMode('survival')}/>
      <Text>Survival Mode is where you send each other a different dare everyday</Text>
      <Text>or</Text>
      <Button title="Select Continuous Mode" onPress={() => setGameMode('continuous')}/>
      <Text>Continuous Mode is where you both keep up your initial dares to each other</Text>
      <Text></Text>
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
      {type === 'friend_requests' ? (
        <Button title="Submit" 
        onPress={() => navigation.navigate('InviteFriend', { dare: dare, gameMode: gameMode })} />
      ) : (
        user ? ( // Check if user is not null
          <Button 
            title="Submit Dare" 
            onPress={() => navigation.navigate('Matchmaking', { 
              dare: {
                userName: user.userName || 'user',
                userId: user.uid,
                dare: dare,
              },
              gameMode: gameMode,
            })} 
          />
        ) : (
          <Text>Please log in to submit a dare.</Text> // Fallback if user is null
        )
      )}
    </View>
  );
}