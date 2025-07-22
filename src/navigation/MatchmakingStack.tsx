import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HabitSelection from '../screens/matchmaking/HabitSelection';
import HabitConfigScreen from '../screens/matchmaking/HabitConfigScreen';
import OpponentSelection from '../screens/matchmaking/OpponentSelection';
import InviteFriendScreen from '../screens/matchmaking/InviteFriendScreen';
import MatchmakingScreen from '../screens/matchmaking/MatchmakingScreen';
import GameStart from '../screens/matchmaking/GameStart';
import { MatchmakingStackParamList } from '../types';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useCallback } from 'react';
import { TabScreenProps } from '../types';


const Stack = createNativeStackNavigator<MatchmakingStackParamList>();

export default function MatchmakingStack({navigation}: TabScreenProps<'MatchmakingStack'>) {

  useFocusEffect(
    useCallback(() => {
      const state = navigation.getState();
      
      if (state.routes && state.routes[state.index]?.state) {
        const matchmakingState = state.routes[state.index].state;
        
        if (matchmakingState &&
          'routes' in matchmakingState && 
          'index' in matchmakingState && 
          typeof matchmakingState.index === 'number'
        ){
          const currentMatchmakingRoute = matchmakingState.routes[matchmakingState.index]?.name;
        
        if (currentMatchmakingRoute && currentMatchmakingRoute !== 'HabitSelection') {
          navigation.navigate('MatchmakingStack', {
            screen: 'HabitSelection'
          });
        }

        }
      }
      
      return () => {
      };
    }, [navigation])
  );

  return (
    <Stack.Navigator >
        <Stack.Screen name="HabitSelection" component={HabitSelection} />
        <Stack.Screen name="HabitConfig" component={HabitConfigScreen} />
        <Stack.Screen name="OpponentSelection" component={OpponentSelection} />
        <Stack.Screen name="InviteFriend" component={InviteFriendScreen} />
        <Stack.Screen name="Matchmaking" component={MatchmakingScreen} />
        <Stack.Screen name="GameStart" component={GameStart} />
    </Stack.Navigator>
  );
}