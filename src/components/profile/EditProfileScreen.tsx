import { View, Text, Button } from "react-native";
import { ProfileStackProps } from "../../types";

export default function EditProfileScreen({navigation}: ProfileStackProps<'EditProfileScreen'>) {
  return (
    <View>
      <Text>Edit your profile!</Text>
      <Button
        title="Save Changes"
        onPress={() => navigation.navigate('ProfileScreen')}
      />
    </View>
  );
}