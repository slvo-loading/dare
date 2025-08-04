import { View, Text, Button } from "react-native";
import { GameStartScreenProps } from "../../types";
import { useRoute, RouteProp } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';


type GameStartRouteParams = {
  type: string;
  match: {opponentId: string, opponentName: string, dare: string}
};

type GameStartRouteProp = RouteProp<
  { GameStart: GameStartRouteParams },
  'GameStart'
>;

export default function GameStart({ navigation }: GameStartScreenProps) {
  const route = useRoute<GameStartRouteProp>();
  const { type, match } = route.params;

  const goToBattleScreen = () => {
    navigation.reset({
        index: 0,
        routes: [{ name: 'BattleScreen' }],
      })
  }

  return (
    <View>
      {type === 'friend' ? (
        <Text>We've sent your invite to {match.opponentName}. Wait for them to accept to start your game.</Text>
      ) : (
        <Text>Your game with {match.opponentName} begins now!</Text>
      )}
      <Button
        title="Next"
        onPress={goToBattleScreen}
      />
    </View>
  );
}