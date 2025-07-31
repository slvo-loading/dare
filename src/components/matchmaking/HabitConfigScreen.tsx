
import { BattleStackProps } from "../../types";
import React, { useState } from "react";
import { View, TextInput, Button, Alert, Text } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig'; // adjust the path
import { useAuth } from '../../context/AuthContext';
import { useRoute, RouteProp } from '@react-navigation/native';
import InviteFriendScreen from "./InviteFriendScreen";

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
  const [dare, setDare] = useState('');
  const { tempUser } = useAuth();
  

  return (
    <View style={{ padding: 16 }}>
      <Text>Rules: (make this into a modal)</Text>
      <Text>1. Keep it Clean: No inappropriate, violent, or harmful dares. Be respectful and kind!
        2. Streak = Strength: Whoever keeps their streak the longest without skipping a dare wins!
        3. Have Fun: Be silly, be brave, and enjoy the chaos 💥</Text>
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
      {type === 'friend_request' ? (
        <Button title="Submit" 
        onPress={() => navigation.navigate('InviteFriend', { dare: dare })} />
      ) : (
        <Button title="Submit Dare" onPress={() => navigation.navigate('Matchmaking', 
          { dare: 
            { userName: tempUser.displayName,
              userId: tempUser.uid,
              dare: dare,
            }}
        )} />
      )}
    </View>
  );
}