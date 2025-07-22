import { View, Text, Button } from "react-native";
import { BattleStackProps } from "../../types";

export default function SubmitScreen({ navigation }: BattleStackProps<'SubmitScreen'>) {
  return (
    <View>
        <Text>Take a photo and send it to your opponent</Text>
        <Button
            title="Submit"
            onPress={() => navigation.reset({
                index: 0,
                routes: [{ name: 'BattleScreen' }],
              })
            }
        />
    </View>
  );
}