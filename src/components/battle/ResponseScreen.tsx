import { View, Text, Button } from "react-native";
import { useRoute, RouteProp } from '@react-navigation/native';
import { BattleStackProps } from "../../types";
import React from 'react';

type ResponseRouteParams = {
    battleId: string;
    turn: boolean;
};
  
type ResponseRouteProp = RouteProp<
    { ResponseScreen: ResponseRouteParams },
    'ResponseScreen'
>;


export default function ResponseScreen({ navigation }: BattleStackProps<'ResponseScreen'>) {
  const route = useRoute<ResponseRouteProp>();
  const { battleId, turn } = route.params;

  return (
    <View>
        <Text>Show the most recent response here for battleID:{battleId}, back buttons</Text>
        {turn ? (
            <>
            <Text>It's your turn! Respond to the battle.</Text>
            <Button
                title="Respond"
                onPress={() => navigation.navigate('SubmitScreen', { battleId: '91011' })}
            />
            </>
            ) : (
            <>
            <Text>Waiting for the opponent's response...</Text>
            <Button
                title="x"
                onPress={() => navigation.goBack()}
            />
          </>
        )}
    </View>
  );
}