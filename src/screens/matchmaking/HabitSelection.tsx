import { View, Text, Button } from "react-native";
import { MatchmakingStackProps } from "../../types";

export default function HabitSelection( {navigation}: MatchmakingStackProps<'HabitSelection'>) {
  return (
    <View>
      <Text>Select a Habit</Text>
      <Button
        title="exercise"
        onPress={() => navigation.navigate('HabitConfig', { type: 'exercise' })}
      />
      <Button
        title="sleep schedule"
        onPress={() => navigation.navigate('HabitConfig', { type: 'sleep schedule' })}
      />
      <Button
        title="food habits"
        onPress={() => navigation.navigate('HabitConfig', { type: 'food habits' })}
      />
    </View>
  );
}
