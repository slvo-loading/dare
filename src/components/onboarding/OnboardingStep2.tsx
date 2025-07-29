// src/screens/onboarding/OnboardingStep2.tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { OnboardingStackProps } from '../../types'

export default function OnboardingStep2({ navigation }: OnboardingStackProps<'Step2'>) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Onboarding Step 2: How many days per week?</Text>
      {/* Add inputs or options here */}
      <Button title="Next" onPress={() => navigation.navigate('Step3')} />
    </View>
  );
}
