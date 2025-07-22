import { View, Text, Button } from "react-native";
import { useAuth } from "../../context/AuthContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProfileStackProps } from '../../types';

export default function ProfileScreen({ navigation }: ProfileStackProps<'ProfileScreen'>) {

  const { logout } = useAuth();

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('onboardingComplete');
      console.log('Onboarding reset successfully');
    } catch (e) {
      console.error('Error resetting onboarding:', e);
    }
  };

  return (
    <View>
      <Text>👤 Profile Screen</Text>
      <Button title="Sign Out" onPress={logout} />
      <Button title="Reset Onboarding" onPress={resetOnboarding} />
      <Button
        title="Friends List"
        onPress={() => navigation.navigate('FriendsList')}
      />
      <Button
        title="Settings"
        onPress={() => navigation.navigate('Settings')}
      />
      <Button
        title="Edit Profile"
        onPress={() => navigation.navigate('EditProfileScreen')}
      />
    </View>
  );
};
