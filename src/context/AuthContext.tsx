// AuthContext.js
import React, { createContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

type AuthContextType = {
  user: TempUserType |null;
  loading: boolean;
  logout: () => Promise<void>;
  tempLogin: ( newUser: string ) => void;
  tempLogout: () => void;
  session: boolean;
};

type AuthProviderProps = {
  children: ReactNode;
};

type TempUserType = {
  uid: string;
  userName: string;
  avatarUrl: string;
  name: string;
  bio: string;
  coins: number;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  tempLogin: ( newUser: string ) => {},
  tempLogout: () => {},
  session: false,
});

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<TempUserType|  null>(null);
  // const [user, setUser] = useState<User |  null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<boolean>(false);

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
  //     setUser(firebaseUser);
  //     setLoading(false);
  
  //     if (firebaseUser) {
  //       const userDocRef = doc(db, 'users', firebaseUser.uid);
  //       const userSnap = await getDoc(userDocRef);
  
  //       if (!userSnap.exists()) {
  //         await setDoc(userDocRef, {
  //           username: '',
  //           avatar_url: '',
  //           bio: '',
  //           created_at: new Date().toISOString(),
  //           rank: 'Unseasoned',
  //           wins: 0,
  //           losses: 0,
  //         });
  //       }
  //     }
  //   });
  
  //   return unsubscribe;
  // }, []);


  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  const tempLogin = async( newUser:string ) => {
    if (newUser) {
      const userDocRef = doc(db, 'users', newUser);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          username: '',
          name: '',
          avatar_url: '',
          bio: '',
          created_at: serverTimestamp(),
          rank: 'Unseasoned',
          last_active: serverTimestamp(),
        });

        setUser({
          uid: newUser,
          userName: '',
          avatarUrl: '' ,
          name: 'User',
          bio: '',
          coins: 0,
        })
        
      } else {
        const data = userSnap.data();
        setUser({
          uid: newUser,
          userName: data.username,
          avatarUrl: data.avatar_url ,
          name: data.name,
          bio: data.bio,
          coins: data.coins,
        })
      }
    }
  }

  const tempLogout = () => {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, tempLogin, tempLogout, session }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};