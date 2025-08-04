// src/screens/auth/LoginScreen.tsx
import React, {useRef, useState} from 'react';
import { View, Text, Button, TextInput } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { auth, app } from "../../../firebaseConfig";
import { PhoneAuthProvider, signInWithCredential, signInWithPhoneNumber } from 'firebase/auth';
import GoogleSignInButton from './GoogleSignInButton';
import AppleSignInButton from './AppleSignInButton';


export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [verificationId, setVerificationId] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const recaptchaVerifier = useRef(null);
  const [message, setMessage] = useState<string>("");
  const { tempLogin } = useAuth();
  const [uid, setUid] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  const sendVerification = async () => {
    try {
      setMessage("");
      const phoneProvider = auth;
      if (recaptchaVerifier.current) {
        const verification = await signInWithPhoneNumber(
          auth,
          phoneNumber,
          recaptchaVerifier.current
        );
        
        if (verification.verificationId){
        setVerificationId(verification.verificationId);
        }
      }

      setMessage("Code has been sent to your phone.");
    } catch (err) {
      if (err instanceof Error) {
        setMessage(`Error: ${err.message}`);
      } else {
        setMessage("An unknown error occurred");
      }
    }
  };


  const confirmCode = async () => {
    try {
      setMessage("");
      const credential = PhoneAuthProvider.credential(
        verificationId,
        code
      );
      await signInWithCredential(auth, credential);
      setMessage("Phone authentication successful!");
    } catch (err) {
      if (err instanceof Error) {
        setMessage(`Error: ${err.message}`);
      } else {
        setMessage("An unknown error occurred");
      }
    }
  };

  return (
    <View style={{ padding: 20 }}>

      <Text>Enter phone number:</Text>
      <TextInput
        style={{ marginVertical: 10, fontSize: 17, borderBottomWidth: 1 }}
        placeholder="+1 999 999 9999"
        autoComplete="tel"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        onChangeText={setPhoneNumber}
        value={phoneNumber}
      />

      <Button title="Send Code" onPress={sendVerification} />

      {verificationId ? (
        <>
          <Text>Enter verification code:</Text>
          <TextInput
            style={{ marginVertical: 10, fontSize: 17, borderBottomWidth: 1 }}
            editable={!!verificationId}
            placeholder="123456"
            onChangeText={setCode}
            keyboardType="number-pad"
            value={code}
          />
          <Button title="Confirm Code" onPress={confirmCode} />
        </>
      ) : null}

      <Text style={{ marginTop: 20 }}>{message}</Text>
      <AppleSignInButton />
      <GoogleSignInButton/>
      <TextInput
        value={uid}
        onChangeText={setUid}
        placeholder="Enter your uid"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 12,
          marginBottom: 12,
        }}
      />
        <TextInput
        value={userName}
        onChangeText={setUserName}
        placeholder="Enter your username"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 12,
          marginBottom: 12,
        }}
      />
      <Button
        title="Temporary Login"
        onPress={() => {
          tempLogin({uid: uid, userName: userName});
        }}
      />
    </View>
  );
}
