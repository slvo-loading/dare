import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyB6jd18FzHRZdXqxp82UGqSp4MbQo_gSFU",
  authDomain: "dare-454c8.firebaseapp.com",
  projectId: "dare-454c8",
  storageBucket: "dare-454c8.firebasestorage.app",
  messagingSenderId: "646217173104",
  appId: "1:646217173104:web:92c89b436e2b235c1bccb5",
  measurementId: "G-FTJ4MG35X6"
};

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);