import { View, Text, Button, SafeAreaView } from "react-native";
import { GameStartScreenProps } from "../../types";
import { useRoute, RouteProp } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';


export default function GameStart({ navigation, route }: GameStartScreenProps) {
  const { type, match } = route.params;

  const goToBattleScreen = () => {
    navigation.reset({
        index: 0,
        routes: [{ name: 'BattleScreen' }],
      })
  }

  return (
    <SafeAreaView>
      {type === 'friend' ? (
        <Text>We've sent your invite to {match.opponentName}. Wait for them to accept to start your game.</Text>
      ) : (
        <Text>Your game with {match.opponentName} begins now!</Text>
      )}
      <Button
        title="Next"
        onPress={goToBattleScreen}
      />
    </SafeAreaView>
  );
}