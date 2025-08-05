import { View, Text, Button, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { useRoute, RouteProp } from '@react-navigation/native';
import { BattleStackProps } from "../../types";
import React, { useEffect, useState, useRef } from 'react';
import { CameraView, CameraType, useCameraPermissions, CameraMode } from 'expo-camera';
import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AntDesign from "@expo/vector-icons/AntDesign";

type ResponseRouteParams = {
    battleId: string;
    dare: string;
    gameMode: string;
};
  
type ResponseRouteProp = RouteProp<
    { ResponseScreen: ResponseRouteParams },
    'ResponseScreen'
>;


export default function ResponseScreen({ navigation }: BattleStackProps<'ResponseScreen'>) {
  const route = useRoute<ResponseRouteProp>();
  const { gameMode, battleId, dare } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [mode, setMode] = useState<CameraMode>("picture");
  const [facing, setFacing] = useState<CameraType>("back");
  const [recording, setRecording] = useState(false);

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync();
    if (photo) {
      navigation.navigate('SubmitScreen', {uri: photo.uri, battleId: battleId, dare: dare, gameMode: gameMode})
    }
  };


  // need to work on recording to be only 15 sec + progress bar
  const recordVideo = async () => {
    if (recording) {
      setRecording(false);
      ref.current?.stopRecording();
      return;
    }
    setRecording(true);
    const video = await ref.current?.recordAsync();
    console.log({ video });
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "picture" ? "video" : "picture"));
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };



  const renderCamera = () => {
    return (
      <CameraView
        style={styles.camera}
        ref={ref}
        mode={mode}
        facing={facing}
        mute={false}
        responsiveOrientationWhenOrientationLocked
      >
        <View style={styles.shutterContainer}>
          <Text style={styles.dareText}>{dare}</Text>
          <Pressable onPress={toggleMode}>
            {mode === "picture" ? (
              <AntDesign name="picture" size={32} color="white" />
            ) : (
              <Feather name="video" size={32} color="white" />
            )}
          </Pressable>
          <Pressable onPress={mode === "picture" ? takePicture : recordVideo}>
            {({ pressed }) => (
              <View
                style={[
                  styles.shutterBtn,
                  {
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.shutterBtnInner,
                    {
                      backgroundColor: mode === "picture" ? "white" : "red",
                    },
                  ]}
                />
              </View>
            )}
          </Pressable>
          <Pressable onPress={toggleFacing}>
            <FontAwesome6 name="rotate-left" size={32} color="white" />
          </Pressable>
        </View>
      </CameraView>
    );
  };


  return (
    <View style={styles.container}>
    {dare ? renderCamera() : <View></View>}
  </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  shutterContainer: {
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
  dareText: {
    color: 'white', 
    fontSize: 20,
    textAlign: 'center', 
    marginTop: 20, 
  },
});