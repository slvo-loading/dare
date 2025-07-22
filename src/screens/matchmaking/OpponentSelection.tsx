import { View, Text, Button } from "react-native";
import { MatchmakingStackProps } from "../../types";


export default function OpponentSelection({navigation}: MatchmakingStackProps<'OpponentSelection'>) {
  return (
    <View>
      <Text>Choose an opponent</Text>
      <Button
        title="Invite a Friend"
        onPress={() => navigation.navigate('InviteFriend')}
      />
      <Button
        title="Someone New"
        onPress={() => navigation.navigate('Matchmaking')}
      />
    </View>
  );
}