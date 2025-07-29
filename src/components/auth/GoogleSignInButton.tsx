import React, { useEffect } from 'react';
import { Button } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as AuthSession from 'expo-auth-session';
import { auth } from '../../../firebaseConfig';

export default function GoogleSignInButton() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '646217173104-d12v90ea999m4gk574it7vjpe957bmnm.apps.googleusercontent.com',
    iosClientId: '646217173104-oudm2g2e9ismm51bpppciefhnd8944o9.apps.googleusercontent.com',
    androidClientId: '646217173104-4aphfpebcrserhdog2gikmd9bonb5u2e.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential);
    }
  }, [response]);

  const checkUri = () => {
    console.log(AuthSession.makeRedirectUri());
  }

  return (
    <>
    <Button
      title="Sign in with Google"
      disabled={!request}
      onPress={() => {
        promptAsync();
      }}
    />
    <Button
      title="Check Redirect URI"
      onPress={checkUri}
      />
    </>
  );
}
