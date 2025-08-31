import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import Navigation from './src/navigation/Navigation';
import { app } from './firebaseConfig'; // Import to ensure it's loaded
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// this is for notifications
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { auth, db } from './firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export default function App() {
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

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

  useEffect(() => {
    registerForPushNotificationsAsync().then(async (token) => {
      if (token && auth.currentUser) {
        setExpoPushToken(token);

        // Save token to Firestore under the current user
        await setDoc(
          doc(db, "users", auth.currentUser.uid),
          { expoPushToken: token },
          { merge: true } // Keeps other user fields intact
        );
      }
    });
  }, []);

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    alert('Push notifications require a physical device!');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Push notification permissions denied!');
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);

    // this is just for android
    // if (Platform.OS === "android") {
    //   Notifications.setNotificationChannelAsync("default", {
    //     name: "default",
    //     importance: Notifications.AndroidImportance.MAX,
    //   });
    // }

    return token;

  } catch (error : any) {
    alert(error);
    return null;
  }
}

  return (
    <SafeAreaProvider>
      <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <Navigation />
        </NavigationContainer>
        </GestureHandlerRootView>
      </AuthProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
