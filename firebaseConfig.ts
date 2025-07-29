import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB6jd18FzHRZdXqxp82UGqSp4MbQo_gSFU",
  authDomain: "dare-454c8.firebaseapp.com",
  projectId: "dare-454c8",
  storageBucket: "dare-454c8.appspot.com",
  messagingSenderId: "646217173104",
  appId: "1:646217173104:web:92c89b436e2b235c1bccb5",
  measurementId: "G-FTJ4MG35X6"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);