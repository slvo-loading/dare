// AuthContext.js
import React, { createContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  tempLogin: () => void;
  tempLogout: () => void;
  session: boolean;
  tempUser: { uid: string; displayName: string}
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  tempLogin: () => {},
  tempLogout: () => {},
  session: false,
  tempUser: { uid: '', displayName: ''}
});

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<boolean>(false);
  const tempUser = {
    uid: "test-user-123",
    displayName: "Tester",
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe; // unsubscribe on unmount
  }, []);


  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  const tempLogin = () => {
    setSession(true);
  }

  const tempLogout = () => {
    setSession(false);
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, tempLogin, tempLogout, session, tempUser }}>
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