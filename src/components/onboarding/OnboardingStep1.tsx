// src/screens/onboarding/OnboardingStep1.tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackProps } from '../../types'

export default function OnboardingStep1({ navigation }: OnboardingStackProps<'Step1'>) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Onboarding Step 1: What's your habit goal?</Text>
      {/* You can add TextInput here later */}
      <Button title="Next" onPress={() => navigation.navigate('Step2')} />
    </View>
  );
}
