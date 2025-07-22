import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import FriendsList from '../screens/profile/FriendsList';
import Settings from '../screens/profile/Settings';
import { ProfileStackParamList } from '../types';


const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <Stack.Screen name="FriendsList" component={FriendsList} />
        <Stack.Screen name="Settings" component={Settings} />
    </Stack.Navigator>
  );
}