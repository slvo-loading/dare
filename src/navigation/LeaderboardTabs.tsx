import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FriendsBoard from '../components/leaderboards/FriendsBoard';
import GlobalBoard from '../components/leaderboards/GlobalBoard';
import { LeaderboardTabsParamList } from '../types';

const Tab = createBottomTabNavigator<LeaderboardTabsParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="GlobalBoard" component={GlobalBoard} />
        <Tab.Screen name="FriendsBoard" component={FriendsBoard} />
    </Tab.Navigator>
  );
}