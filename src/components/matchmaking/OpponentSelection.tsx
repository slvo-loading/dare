import { View, Text, Button, SafeAreaView } from "react-native";
import { BattleStackProps } from "../../types";


export default function OpponentSelection({navigation}: BattleStackProps<'OpponentSelection'>) {
  return (
    <SafeAreaView>
      <Text>Choose an opponent</Text>
      <Button
        title="Invite a Friend"
        onPress={() => navigation.navigate('HabitConfig', { battle: null, type: 'friend_requests' })}
      />
      <Button
        title="Someone New"
        onPress={() => navigation.navigate('HabitConfig', { battle: null, type: 'matchmaking_queue' })}
      />
    </SafeAreaView>
  );
}