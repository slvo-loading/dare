import { View, Text, Button, SafeAreaView, ScrollView, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from "../../../firebaseConfig";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { BattleStackProps } from "../../types";
import { useRoute, RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

type Media = {
    id: string;
    media: {type: string, uri: string}[];
    caption: string;
    thumbnail: string;
}

type DraftRouteParams = {
    battleId: string;
    dare: string;
    gameMode: string;
};

type DraftRouteProp = RouteProp<
    { DraftPickScreen: DraftRouteParams },
    'DraftPickScreen'
>;


export default function DraftPickScreen({ navigation }: BattleStackProps<'DraftPickScreen'> ) {
    const route = useRoute<DraftRouteProp>();
    const { gameMode, battleId, dare } = route.params;

    const { user } = useAuth();
    const [drafts, setDrafts] = useState<Media[]>([]);
    const [selectedDraft, setSelectedDraft] = useState<Media | null>(null);

    useFocusEffect(
        useCallback(() => {
            fetchDraft();
        }, [])
    )

    const fetchDraft = async () => {
        if(!user) return;

        const draftsRef = collection(db, 'users', user.uid, 'drafts');
        const snapshot = await getDocs(draftsRef);

        console.log("Drafts fetched:", snapshot.docs.length);

        const draftsArray: Media[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            draftsArray.push({
                id: doc.id,
                media: data.media,
                caption: data.caption,
                thumbnail: data.thumbnail
            });
        });

    setDrafts(draftsArray);
    }

 const handleNext = async () => {
    if (!user || !selectedDraft) return;

    try {
        const draftDocRef = doc(db, 'users', user.uid, 'drafts', selectedDraft.id);
        await deleteDoc(draftDocRef);
    } catch (error) {
        console.log (error)
    }

    navigation.navigate('SubmitScreen', 
        {uri: selectedDraft.media, battleId: battleId, 
        dare: dare, gameMode: gameMode, caption: selectedDraft.caption, draft: true})
 }

useEffect(() => {
    console.log("Drafts fetched:", drafts);
})

  return (
    <SafeAreaView>
        <Button title='x' onPress={() => navigation.goBack()} />
    {drafts.length > 0 ? (
        <ScrollView>
        {drafts.map((draft, index) => (
            <View key={index} style={{ margin: 10 }}>
                <Image
                    source={{ uri: draft.thumbnail }}
                    style={{ width: 100, height: 100, marginBottom: 10 }}
                />
                <Button title="Select" onPress={() => setSelectedDraft(drafts[index])}/>
            </View>
        ))}
        {selectedDraft && (
            <Button title="Next" onPress={handleNext}/>
        )}
        </ScrollView>
    ) : (
       <Text>No drafts available</Text>
    )}
    </SafeAreaView>
  );
};