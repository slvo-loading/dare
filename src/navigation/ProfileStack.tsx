import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EditProfileScreen from '../components/profile/EditProfileScreen';
import FriendsList from '../components/profile/FriendsList';
import ProfileScreen from '../components/profile/ProfileScreen';
import Settings from '../components/profile/Settings';
import CropScreen from '../components/profile/CropScreen';
import AddInterestScreen from '../components/profile/AddInterestScreen';
import EditInterestScreen from '../components/profile/EditInterest';
import EditPin from '../components/profile/EditPin';
import AllReportsScreen from '../components/profile/AllReportsScreen';
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
        <Stack.Screen name="AddInterests" component={AddInterestScreen} />
        <Stack.Screen name="EditInterest" component={EditInterestScreen} />
        <Stack.Screen name="EditPin" component={EditPin} />
        <Stack.Screen name="AllReportsScreen" component={AllReportsScreen} />
    </Stack.Navigator>
  );
}