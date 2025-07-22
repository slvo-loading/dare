import { View, Text, Button } from "react-native";
import { MatchmakingStackProps } from "../../types";

export default function InviteFriendScreen({ navigation }: MatchmakingStackProps<'InviteFriend'>) {
  return (
    <View>
      <Text>send the invite to your friend</Text>
      <Button
        title="1234"
        onPress={() => navigation.navigate('GameStart', { type: 'friend', opponentId: '1234'})}
      />
      <Button
        title="5678"
        onPress={() => navigation.navigate('GameStart', { type: 'friend', opponentId: '5678'})}
      />
      <Button
        title="91011"
        onPress={() => navigation.navigate('GameStart', { type: 'friend', opponentId: '91011'})}
      />
    </View>
  );
}