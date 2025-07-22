import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BattleScreen from '../screens/battle/BattleScreen';
import ResponseScreen from '../screens/battle/ResponseScreen';
import SubmitScreen from '../screens/battle/SubmitScreen';
import { BattleStackParamList } from '../types';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useCallback } from 'react';
import { TabScreenProps } from '../types';

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
    </Stack.Navigator>
  );
}