import { View, Text, Button } from "react-native";
import { ProfileStackProps } from '../../types';

export default function FriendsList({ navigation }: ProfileStackProps<'FriendsList'>) {
  return (
    <View>
        <Text>Incoming requests</Text>
        <Button
            title="Profile 891011"
            onPress={() => navigation.navigate('OtherProfiles', { userId: '891011' })}
        />
        <Button
            title="Profile 1213"
            onPress={() => navigation.navigate('OtherProfiles', { userId: '1213' })}
        />
        <Text>Friend's List Screen</Text>
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
