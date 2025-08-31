import { View, Text, Button, SafeAreaView, ScrollView, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from "../../../firebaseConfig";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { BattleStackProps } from "../../types";
import { useRoute, RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Media = {
    id: string;
    media: {type: string, uri: string}[];
    caption: string;
    thumbnail: string;
}

type DraftRouteParams = {
    battleId: string;
    dare: string;
};

type DraftRouteProp = RouteProp<
    { DraftPickScreen: DraftRouteParams },
    'DraftPickScreen'
>;


export default function DraftPickScreen({ navigation }: BattleStackProps<'DraftPickScreen'> ) {
    const route = useRoute<DraftRouteProp>();
    const { battleId, dare } = route.params;

    const { user } = useAuth();
    const [drafts, setDrafts] = useState<Media[]>([]);
    const [selectedDraft, setSelectedDraft] = useState<Media | null>(null);

    useFocusEffect(
        useCallback(() => {
            fetchDraft();
        }, [])
    )

    //fetch drafts from async storage
    const fetchDraft = async () => {
        if(!user) return;

        try {
            const draftsRaw = await AsyncStorage.getItem(`drafts_${user.uid}`);
            const drafts = draftsRaw ? JSON.parse(draftsRaw) : [];
            setDrafts(drafts);
          } catch (e) {
            console.error("Failed to load drafts", e);
            return [];
          }
    }


    const handleNext = async () => {
        if (!user || !selectedDraft) return;

        try {
            setDrafts(prevDrafts => {
                const updated = prevDrafts.filter(draft => draft.id !== selectedDraft.id);
                AsyncStorage.setItem(`drafts_${user.uid}`, JSON.stringify(updated));
                return updated;
            });
        } catch (error) {
            console.log (error)
        }

        navigation.navigate('SubmitScreen', 
            {uri: selectedDraft.media, battleId: battleId, 
            dare: dare, caption: selectedDraft.caption,})
    }

  return (
    <SafeAreaView>
        <Button title='x' onPress={() => navigation.goBack()} />
    {drafts.length > 0 ? (
        <ScrollView>
        {selectedDraft && (
            <Button title="Next" onPress={handleNext}/>
        )}
        {drafts.map((draft, index) => (
            <View key={index} style={{ margin: 10 }}>
                <Image
                    source={{ uri: draft.thumbnail }}
                    style={{ width: 100, height: 100, marginBottom: 10 }}
                />
                <Button title="Select" onPress={() => setSelectedDraft(drafts[index])}/>
            </View>
        ))}
        </ScrollView>
    ) : (
       <Text>No drafts available</Text>
    )}
    </SafeAreaView>
  );
};