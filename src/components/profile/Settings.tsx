import { View, Text, Button, SafeAreaView } from "react-native";
import { ProfileStackProps } from "../../types";


export default function Settings({ navigation }: ProfileStackProps<'Settings'>) {
  return (
    <SafeAreaView>
      <Text>Settings</Text>
      <Button
        title="Save Changes"
        onPress={() => navigation.navigate('ProfileScreen')}
      />
    </SafeAreaView>
  );
}