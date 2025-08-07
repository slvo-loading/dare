import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EditProfileScreen from '../components/profile/EditProfileScreen';
import FriendsList from '../components/profile/FriendsList';
import ProfileScreen from '../components/profile/ProfileScreen';
import Settings from '../components/profile/Settings';
import CropScreen from '../components/profile/CropScreen';
import { ProfileStackParamList } from '../types';


const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <Stack.Screen name="CropScreen" component={CropScreen} />
        <Stack.Screen name="FriendsList" component={FriendsList} />
        <Stack.Screen name="Settings" component={Settings} />
    </Stack.Navigator>
  );
}