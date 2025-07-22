import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OnboardingStep1 from '../screens/onboarding/OnboardingStep1';
import OnboardingStep2 from '../screens/onboarding/OnboardingStep2';
import OnboardingStep3 from '../screens/onboarding/OnboardingStep3';
import { OnboardingStackParamList } from '../types';

type OnboardingStackProps = {
    onFinish: () => void;
  };

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingStack({ onFinish }: OnboardingStackProps) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Step1" component={OnboardingStep1} />
      <Stack.Screen name="Step2" component={OnboardingStep2} />
      <Stack.Screen
        name="Step3"
        children={(props) => <OnboardingStep3 {...props} onFinish={onFinish} />}
      />
    </Stack.Navigator>
  );
}
