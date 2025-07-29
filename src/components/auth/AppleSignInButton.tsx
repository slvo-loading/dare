import React, { useState, useEffect } from 'react';
import { Alert, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { auth } from '../../../firebaseConfig'
import { signInWithCredential, OAuthProvider } from 'firebase/auth';
import * as Crypto from 'expo-crypto';

async function generateNonce(length = 32) {
  const charset =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
  let result = '';
  const randomValues = await Crypto.getRandomBytesAsync(length);
  randomValues.forEach((value) => {
    result += charset[value % charset.length];
  });
  return result;
}

// Hash the nonce for security (recommended by Firebase)
async function sha256(plain: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    plain
  );
  return digest;
}

export default function AppleSignInButton() {
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  useEffect(() => {
    const checkApple = async () => {
      const available = await AppleAuthentication.isAvailableAsync();
      setIsAppleAvailable(available);
    };
    checkApple();
  }, []);

  async function onAppleButtonPress() {
    try {
      // Generate and hash nonce for added security
      const rawNonce = await generateNonce();
      const hashedNonce = await sha256(rawNonce);
      
      // Start the Apple sign-in request
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce, // Use hashed nonce
      });

      if (!appleCredential.identityToken) {
        throw new Error('Apple Sign-In failed - no identity token returned');
      }

      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: appleCredential.identityToken,
        rawNonce,
      });
      
      // Sign in with Firebase
      const userCredential = await signInWithCredential(auth, firebaseCredential);
      
      console.log('Successfully signed in:', userCredential.user.uid);
      Alert.alert('Success', 'Signed in with Apple!');
      
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'An unknown error occurred during Apple Sign-In');
      }
    }
  }

  return (
    <View>
      {isAppleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={5}
          style={{ width: 200, height: 44 }}
          onPress={onAppleButtonPress}
        />
      )}
    </View>
  );
}
