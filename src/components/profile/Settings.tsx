import { View, Text, Button } from "react-native";
import { ProfileStackProps } from "../../types";


export default function Settings({ navigation }: ProfileStackProps<'Settings'>) {
  return (
    <View>
      <Text>Settings</Text>
      <Button
        title="Save Changes"
        onPress={() => navigation.navigate('ProfileScreen')}
      />
    </View>
  );
}