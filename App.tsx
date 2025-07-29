import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import Navigation from './src/navigation/Navigation';
import { app } from './firebaseConfig'; // Import to ensure it's loaded

export default function App() {
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    // Check if Firebase is initialized
    try {
      console.log("Firebase app name:", app.name);
      setIsFirebaseReady(true);
    } catch (error) {
      console.error("Firebase initialization error:", error);
    }
  }, []);

  if (!isFirebaseReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading Firebase...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Navigation />
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
