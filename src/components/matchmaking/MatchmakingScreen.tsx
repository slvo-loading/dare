import { View, Text, Button } from "react-native";
import { BattleStackProps } from "../../types";
import React, { useState } from "react";

export default function MatchmakingScreen({ navigation }: BattleStackProps<'Matchmaking'>) {
  const [rejectedDareIds, setRejectedDareIds] = useState<string[]>([]);
  const handleBattleCreation = () => {

  }

  return (
    <View>
      <Text>We're finding you a match</Text>
      <Button
        title="Accept"
        onPress={() => navigation.navigate('GameStart', { type: 'matchmaking', opponentId: '1234'})}
      />
      <Button
        title="Decline"
      />
    </View>
  );
}