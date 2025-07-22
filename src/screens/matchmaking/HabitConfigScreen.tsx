import { View, Text, Button } from "react-native";
import { useRoute, RouteProp } from '@react-navigation/native';
import { MatchmakingStackProps } from "../../types";

type HabitConfigRouteParams = {
    type: string;
};
  
type HabitConfigRouteProp = RouteProp<
    { HabitConfig: HabitConfigRouteParams },
    'HabitConfig'
>;

export default function HabitConfigScreen({ navigation }: MatchmakingStackProps<'HabitConfig'>) {
  const route = useRoute<HabitConfigRouteProp>();
  const { type } = route.params;
  return (
    <View>
      <Text>Configurate your dare for {type} here</Text>
      <Button
        title="Next"
        onPress={() => navigation.navigate('OpponentSelection')}
      />
    </View>
  );
}