import { View, Text, Button } from "react-native";
import { LeaderboardProps } from "../../types";

export default function GlobalBoard({ navigation }: LeaderboardProps<'GlobalBoard'>) {
  return (
    <View>
        <Text>Global LeaderBoard</Text>
        <Button
            title="Profile 4567"
            onPress={() => navigation.navigate('OtherProfiles', { userId: '4567' })}
        />
        <Button
            title="Profile 1234"
            onPress={() => navigation.navigate('OtherProfiles', { userId: '1234' })}
        />
    </View>
  );
}