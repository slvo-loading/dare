import { View, Text, Button, SafeAreaView } from "react-native";
import { ProfileStackProps } from "../../types";
import { useAuth } from "../../context/AuthContext";


export default function Settings({ navigation }: ProfileStackProps<'Settings'>) {
  const { user, tempLogout } = useAuth();
  return (
    <SafeAreaView>
      <Text>Settings</Text>
      <Button
        title="Save Changes"
        onPress={() => navigation.navigate('ProfileScreen')}
      />
      <Button
        title="Logout"
        onPress={() => {
          tempLogout();
        }}
        />
    </SafeAreaView>
  );
}