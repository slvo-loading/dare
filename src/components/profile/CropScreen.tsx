import { View, Text, Button, SafeAreaView, Image, StyleSheet, Dimensions } from "react-native";
import { ProfileStackProps } from "../../types";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from "../../context/AuthContext";
import { db } from "../../../firebaseConfig";
import { updateDoc, doc, } from "firebase/firestore";
import React, { useState, useRef } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

type CropScreenRouteParams = {
    imageUri: string;
};
  
type CropScreenRouteProp = RouteProp<
    { CropScreen: CropScreenRouteParams },
    'CropScreen'
>;

const windowWidth = Dimensions.get('window').width;
const cropSize = 300;

export default function CropScreen({ navigation }: ProfileStackProps<'CropScreen'>) {
  const route = useRoute<CropScreenRouteProp>();
  const { imageUri } = route.params;
  const { user } = useAuth();

  // Gesture state
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = e.scale;
    })
    .onEnd(() => {
      scale.value = withTiming(Math.max(scale.value, 1)); // minimum zoom 1
    });

  const panGesture = Gesture.Pan()
  .onUpdate(e => {
    translateX.value = e.translationX; // Use translationX
    translateY.value = e.translationY; // Use translationY
  })
  .onEnd(() => {
    // Optionally reset translation values after the gesture ends
    translateX.value = withTiming(translateX.value);
    translateY.value = withTiming(translateY.value);
  });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleSave = async () => {
    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        avatar_url: imageUri,
    });

      navigation.navigate('ProfileScreen');
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  }

  // const handleCrop = async () => {
  //   const cropConfig = {
  //     originX: cropOriginXInOriginal,
  //     originY: cropOriginYInOriginal,
  //     width: cropWidthInOriginal,
  //     height: cropHeightInOriginal,
  //   };
  
  //   // Clamp crop coordinates so they don't go outside the original image
  //   cropConfig.originX = Math.max(0, cropConfig.originX);
  //   cropConfig.originY = Math.max(0, cropConfig.originY);
  //   if (cropConfig.originX + cropConfig.width > imageWidth) {
  //     cropConfig.originX = imageWidth - cropConfig.width;
  //   }
  //   if (cropConfig.originY + cropConfig.height > imageHeight) {
  //     cropConfig.originY = imageHeight - cropConfig.height;
  //   }
  
  //   const cropped = await ImageManipulator.manipulateAsync(
  //     imageUri,
  //     [{ crop: cropConfig }],
  //     { compress: 1, format: ImageManipulator.SaveFormat.PNG }
  //   );
  
  //   onCropDone(cropped.uri);
  // };  

  return (
    <SafeAreaView>

    <GestureDetector gesture={Gesture.Simultaneous(panGesture, pinchGesture)}>
        <Animated.View>
            <Animated.Image
              source={{ uri: imageUri }}
              style={[{ width: cropSize, height: cropSize }, animatedImageStyle]}
              resizeMode="contain"
            />
        </Animated.View>
      </GestureDetector>
      {/* Circle overlay */}
      <View style={styles.circleOverlay} pointerEvents="none" />

      <Button title="Crop" />

      <Button
        title="Cancel"
        onPress={() => navigation.goBack()}
      />
      <Button
        title="Save"
        onPress={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cropSize,
    height: cropSize,
    alignSelf: 'center',
    marginTop: 50,
  },
  circleOverlay: {
    position: 'absolute',
    width: cropSize,
    height: cropSize,
    borderRadius: cropSize / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    top: 0,
    left: 0,
  },
});
