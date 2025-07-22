import { View, Text, Button } from "react-native";
import { BattleStackProps } from "../../types";

export default function BattleScreen({ navigation }: BattleStackProps<'BattleScreen'>) {
  return (
    <View>
      <Text>Dare Requests</Text>
      <Button
        title="Request from 1234"
      />
      <Text>In Progress Dares</Text>
      <Button
        title="Battle 1234"
        onPress={() => navigation.navigate('ResponseScreen', { battleId: '1234', turn: true })}
      />
      <Button
        title="Battle 5678"
        onPress={() => navigation.navigate('ResponseScreen',  { battleId: '5678', turn: false })}
      />
      <Button
        title="Battle 91011"
        onPress={() => navigation.navigate('ResponseScreen', { battleId: '91011', turn: false })}
      />
    </View>
  );
}
