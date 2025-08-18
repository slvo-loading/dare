import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import BattleScreen from '../components/battle/BattleScreen';
import ResponseScreen from '../components/battle/ResponseScreen';
import SubmitScreen from '../components/battle/SubmitScreen';
import DraftPickScreen from '../components/battle/DraftPickScreen';
import { BattleStackParamList, TabScreenProps } from '../types';

import GameStart from '../components/matchmaking/GameStart';
import HabitConfigScreen from '../components/matchmaking/HabitConfigScreen';
import InviteFriendScreen from '../components/matchmaking/InviteFriendScreen';
import MatchmakingScreen from '../components/matchmaking/MatchmakingScreen';
import OpponentSelection from '../components/matchmaking/OpponentSelection';
import ResultScreen from '../components/battle/ResultScreen';

const Stack = createNativeStackNavigator<BattleStackParamList>();

export default function BattleStack({ navigation }: TabScreenProps<'BattleStack'>) {

useFocusEffect(
    useCallback(() => {
      const state = navigation.getState();
      
      if (state.routes && state.routes[state.index]?.state) {
        const BattleState = state.routes[state.index].state;
        
        if (BattleState &&
          'routes' in BattleState && 
          'index' in BattleState && 
          typeof BattleState.index === 'number'
        ){
          const currentMatchmakingRoute = BattleState.routes[BattleState.index]?.name;
        
        if (currentMatchmakingRoute && currentMatchmakingRoute !== 'BattleScreen') {
     
          navigation.navigate('BattleStack', {
            screen: 'BattleScreen'
          });
        }

        }
      }
      
      return () => {
      };
    }, [navigation])
  );

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="BattleScreen" component={BattleScreen} />
        <Stack.Screen name="ResponseScreen" component={ResponseScreen} />
        <Stack.Screen name="SubmitScreen" component={SubmitScreen} />
        <Stack.Screen name="DraftPickScreen" component={DraftPickScreen} />
        <Stack.Screen name="ResultScreen" component={ResultScreen} />
        <Stack.Screen name="HabitConfig" component={HabitConfigScreen} />
        <Stack.Screen name="OpponentSelection" component={OpponentSelection} />
        <Stack.Screen name="InviteFriend" component={InviteFriendScreen} />
        <Stack.Screen name="Matchmaking" component={MatchmakingScreen} />
        <Stack.Screen name="GameStart" component={GameStart} />
    </Stack.Navigator>
  );
}