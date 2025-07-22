import { View, Text, Button } from "react-native";
import { MatchmakingStackProps } from "../../types";

export default function MatchmakingScreen({ navigation }: MatchmakingStackProps<'Matchmaking'>) {
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