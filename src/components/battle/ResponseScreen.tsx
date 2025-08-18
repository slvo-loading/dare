import { View, Text, Button, Dimensions, 
  StyleSheet, Pressable,
} from "react-native";
import { useRoute, RouteProp } from '@react-navigation/native';
import { BattleStackProps } from "../../types";
import React, { useEffect, useState, useRef } from 'react';
import { CameraView, CameraType, useCameraPermissions, CameraMode } from 'expo-camera';
import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AntDesign from "@expo/vector-icons/AntDesign";
import PostView from "./PostView";

type ResponseRouteParams = {
    battleId: string;
    dare: string;
};
  
type ResponseRouteProp = RouteProp<
    { ResponseScreen: ResponseRouteParams },
    'ResponseScreen'
>;

type Submission = {
  id: string,
  caption: string;
  dare: string;
  media_url: string;
  submitted_at: string;
}

type NewSubmission = {
  type: string;
  uri: string;
}

const { height } = Dimensions.get('window');

export default function ResponseScreen({ navigation }: BattleStackProps<'ResponseScreen'>) {
  const route = useRoute<ResponseRouteProp>();
  const { battleId, dare } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [mode, setMode] = useState<CameraMode>("picture");
  const [facing, setFacing] = useState<CameraType>("back");
  const [recording, setRecording] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [showSubmissions, setShowSubmissions] = useState(false);
  const [newSubmission, setNewSubmission] = useState<NewSubmission[]>([]);


  useEffect(() => {
    {dare === "Waiting for dare" ? (
      setShowSubmissions(true)
    ) : (
      setShowSubmissions(false)
    )}
  }, [dare, battleId]);

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
      setNewSubmission(prev => [...prev, { type: 'photo', uri: photo.uri,}]);
    }
  };


  // need to work on recording to be only 15 sec + progress bar
  const recordVideo = async () => {
    if (recording) {
      console.log("Recording stopped");
      setRecording(false);

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current); 
      }

      ref.current?.stopRecording();
      return;
    }

    setRecording(true);
    console.log("Recording started");

    timerRef.current = setTimeout(() => {
    console.log("Recording auto-stopped after 15 seconds");
    setRecording(false);
    ref.current?.stopRecording();
  }, 15000);

    const video = await ref.current?.recordAsync();
    if (video) {
      console.log("Video recorded:", video.uri);
      setNewSubmission(prev => [...prev, { type: 'video', uri: video.uri }]);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "picture" ? "video" : "picture"));
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const onViewSubmissions = (bool: boolean) => {
    setShowSubmissions(bool);
  }

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
          <Pressable onPress={() => onViewSubmissions(true)}>
            <Text style={{ color: 'white' }}>Subs</Text>
          </Pressable>
          {newSubmission.length > 0 && (
          <Pressable onPress={() => 
            navigation.navigate('SubmitScreen', 
            {uri: newSubmission, battleId: battleId, dare: dare, caption: null,})}>
              <Text style={{ color: 'white' }}>Submit</Text>
            </Pressable>
          )}
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
          <Pressable onPress={() => 
            navigation.navigate('DraftPickScreen', 
            { battleId: battleId, dare: dare,})}>
              <Text style={{ color: 'white' }}>Drafts</Text>
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
      <Button title="x" onPress={() => navigation.reset({
        index: 0,
        routes: [{ name: "BattleScreen" }],
      })}/>
      { showSubmissions ? (
        <PostView battleId={battleId} onViewSubmissions={onViewSubmissions} dare={dare}/>
      ) : (
        renderCamera()
      )}
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
    width: "100%",
    aspectRatio: 1,
    height: undefined,
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
  flatListContent: {
    padding: 20, // Add padding to the FlatList content
  },
  submissionItem: {
    width: '100%',
    padding: 20,
    marginBottom: 20,
    backgroundColor: '#333', // Add a background color for better visibility
    borderRadius: 10,
    alignItems: 'center',
  },
  submissionImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 10,
  },
  submissionText: {
    color: 'black',
    fontSize: 16,
    marginBottom: 5,
  },
});