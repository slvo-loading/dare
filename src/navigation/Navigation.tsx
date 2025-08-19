import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import { db } from '../../firebaseConfig'; 
const Stack = createNativeStackNavigator<RootStackParamList>();

import FriendsList from '../components/profile/FriendsList';
import OtherProfiles from '../components/root/OtherProfiles';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import OnboardingStack from './OnboardingStack';

export default function Navigation() {
  const { user, session } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem('onboardingComplete');
        setOnboardingComplete(value === 'true');
      } catch (e) {
        console.error('Failed to fetch onboarding status:', e);
        setOnboardingComplete(false);
      }
    };
    checkOnboarding();
  }, []);

  if (onboardingComplete === null) {
    return null;
  }

  if (!onboardingComplete) {
    return <OnboardingStack onFinish={async () => {
      await AsyncStorage.setItem('onboardingComplete', 'true');
      setOnboardingComplete(true);
    }} />;
  }


  // update last active timestamp when user logs in or navigates
  // useEffect(() => {
  //   if (user?.uid) {
  //     const updateLastActive = async () => {
  //       try {
  //         const userRef = doc(db, "users", user.uid);
  //         await updateDoc(userRef, {
  //           last_active: serverTimestamp(),
  //         });
  //       } catch (err) {
  //         console.error("Error updating last active:", err);
  //       }
  //     };
  
  //     updateLastActive();
  //   }
  // }, [user?.uid]);

  return (
    user ? (
    <Stack.Navigator>
        <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
        />
        <Stack.Screen name="FriendsList" component={FriendsList} />
        <Stack.Screen name="OtherProfiles" component={OtherProfiles}/>
    </Stack.Navigator>
    ) : (
        <AuthStack />
    )
  )
}
