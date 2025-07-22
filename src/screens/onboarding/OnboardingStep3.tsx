import React from 'react';
import { View, Text, Button } from 'react-native';

type Props = {
  navigation: any;
  onFinish: () => void;
};

export default function OnboardingStep3({ onFinish }: Props) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Last Onboarding Step</Text>
      <Button title="Finish" onPress={onFinish} />
    </View>
  );
}

