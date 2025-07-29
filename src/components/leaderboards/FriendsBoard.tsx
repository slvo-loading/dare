import { View, Text, Button } from "react-native";
import { LeaderboardProps } from "../../types";


export default function FriendsBoard({navigation}: LeaderboardProps<'FriendsBoard'>) {

    return (
    <View>
        <Text>Friend's LeaderBoard</Text>
        <Button
            title="Profile 1234"
            onPress={() => navigation.navigate('OtherProfiles', { userId: '1234' })}
        />
        <Button
            title="Profile 4567"
            onPress={() => navigation.navigate('OtherProfiles', { userId: '4567' })}
        />
    </View>
  );
}