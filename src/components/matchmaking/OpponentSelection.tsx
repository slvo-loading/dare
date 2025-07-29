import { View, Text, Button } from "react-native";
import { BattleStackProps } from "../../types";


export default function OpponentSelection({navigation}: BattleStackProps<'OpponentSelection'>) {
  return (
    <View>
      <Text>Choose an opponent</Text>
      <Button
        title="Invite a Friend"
        onPress={() => navigation.navigate('HabitConfig', { type: 'friend_requests' })}
      />
      <Button
        title="Someone New"
        onPress={() => navigation.navigate('HabitConfig', { type: 'matchmaking_queue' })}
      />
    </View>
  );
}