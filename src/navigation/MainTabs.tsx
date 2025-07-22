// src/navigation/MainTabs.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ProfileStack from './ProfileStack';
import { MainTabParamList } from '../types';
import MatchmakingStack from './MatchmakingStack';
import BattleStack from './BattleStack';
import LeaderboardTabs from './LeaderboardTabs';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="MatchmakingStack" component={MatchmakingStack} />
      <Tab.Screen name="BattleStack" component={BattleStack} />
      <Tab.Screen name="Leaderboard" component={LeaderboardTabs} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
