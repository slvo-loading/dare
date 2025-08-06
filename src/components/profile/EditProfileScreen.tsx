import { View, Text, Button, SafeAreaView } from "react-native";
import { ProfileStackProps } from "../../types";

export default function EditProfileScreen({navigation}: ProfileStackProps<'EditProfileScreen'>) {
  return (
    <SafeAreaView>
      <Text>Edit your profile!</Text>
      <Button
        title="Save Changes"
        onPress={() => navigation.navigate('ProfileScreen')}
      />
    </SafeAreaView>
  );
}