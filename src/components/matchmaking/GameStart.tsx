import { View, Text, Button } from "react-native";
import { GameStartScreenProps } from "../../types";
import { useRoute, RouteProp } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';


type GameStartRouteParams = {
  type: string;
  opponentId: string;
};

type GameStartRouteProp = RouteProp<
  { GameStart: GameStartRouteParams },
  'GameStart'
>;

export default function GameStart({ navigation }: GameStartScreenProps) {
  const route = useRoute<GameStartRouteProp>();
  const { type, opponentId } = route.params;

  const goToBattleScreen = () => {
    navigation.reset({
        index: 0,
        routes: [{ name: 'BattleScreen' }],
      })
  }

  return (
    <View>
      {type === 'friend' ? (
        <Text>We've sent your invite to {opponentId}. Wait for the to accept to start your game.</Text>
      ) : (
        <Text>Your game with {opponentId} begins now!</Text>
      )}
      <Button
        title="Next"
        onPress={goToBattleScreen}
      />
    </View>
  );
}