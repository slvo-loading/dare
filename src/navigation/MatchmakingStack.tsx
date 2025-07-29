// import { useFocusEffect } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import React, { useCallback } from 'react';
// import GameStart from '../components/matchmaking/GameStart';
// import HabitConfigScreen from '../components/matchmaking/HabitConfigScreen';
// import HabitSelection from '../components/matchmaking/HabitSelection';
// import InviteFriendScreen from '../components/matchmaking/InviteFriendScreen';
// import MatchmakingScreen from '../components/matchmaking/MatchmakingScreen';
// import OpponentSelection from '../components/matchmaking/OpponentSelection';
// import { BattleStackParamList, TabScreenProps } from '../types';


// const Stack = createNativeStackNavigator<BattleStackParamList>();

// export default function MatchmakingStack({navigation}: TabScreenProps<'MatchmakingStack'>) {

  // useFocusEffect(
  //   useCallback(() => {
  //     const state = navigation.getState();
      
  //     if (state.routes && state.routes[state.index]?.state) {
  //       const matchmakingState = state.routes[state.index].state;
        
  //       if (matchmakingState &&
  //         'routes' in matchmakingState && 
  //         'index' in matchmakingState && 
  //         typeof matchmakingState.index === 'number'
  //       ){
  //         const currentMatchmakingRoute = matchmakingState.routes[matchmakingState.index]?.name;
        
  //       if (currentMatchmakingRoute && currentMatchmakingRoute !== 'HabitSelection') {
  //         navigation.navigate('MatchmakingStack', {
  //           screen: 'HabitSelection'
  //         });
  //       }

  //       }
  //     }
      
  //     return () => {
  //     };
  //   }, [navigation])
  // );

//   return (
//     <Stack.Navigator >
//         <Stack.Screen name="HabitConfig" component={HabitConfigScreen} />
//         <Stack.Screen name="OpponentSelection" component={OpponentSelection} />
//         <Stack.Screen name="InviteFriend" component={InviteFriendScreen} />
//         <Stack.Screen name="Matchmaking" component={MatchmakingScreen} />
//         <Stack.Screen name="GameStart" component={GameStart} />
//     </Stack.Navigator>
//   );
// }