import { View, Text, Button, ActivityIndicator, Image, ScrollView, 
  TouchableOpacity, Modal, StyleSheet,} from "react-native";
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from "../../context/AuthContext";
import { db } from "../../../firebaseConfig";
import { query, where, deleteDoc, getDocs, collection, 
  doc, setDoc, serverTimestamp, orderBy, getDoc } from "firebase/firestore";
import PostView from "../battle/PostView";
import React, { useState, useEffect } from "react";

type OtherProfilesRouteParams = {
    userId: string;
};
  
type OtherProfilesRouteProp = RouteProp<
    { OtherProfiles: OtherProfilesRouteParams },
    'OtherProfiles'
>;

type User = {
  userName: string;
  avatarUrl: string;
  name: string;
  bio: string;
  friendCount: number;
  coins: number;
};


type Interests = {
  id: string;
  caption: string;
  imageUrl: Media[];
  createdAt: string;
}

type Media = {
  type: string;
  uri: string;
}

type Battle = {
  id: string;
  thumbnail: string;
  title: string
}

export default function OtherProfiles({ navigation }: {navigation: any}) {
  const route = useRoute<OtherProfilesRouteProp>();
  const userId = route.params.userId;
  const [friendStatus, setFriendStatus] = useState<string | null>(null); 
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [interests, setInterests] = useState<Interests[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinnedGames, setPinnedGames] = useState<Battle[]>([]);
  const [selectedGame, setSelectedGame] = useState<Battle | null>(null);
  const [showSubmissions, setShowSubmissions] = useState<boolean>(false);
  const [index, setIndex] = useState<number>(0);
  const [type, setType] = useState<string>("");
  const { user } = useAuth();


// on mount gets the friend status of the other profile
  useEffect(() => {
    checkFriendStatus();
    fetchUserProfile();
    fetchInterests();
    fetchPinnedGames();
  }, [userId]);


  // checks the whether the userProfile is a friend to the user
  const checkFriendStatus = async () => {
    if (!user) {return}

    // gets docs for bi-directional friendship status
    const docId = [user.uid, userId].sort().join("_");

    try {
      const friendshipDocRef = doc(db, "friends", docId);
      const friendshipDocSnap = await getDoc(friendshipDocRef);
      if (friendshipDocSnap.exists()) {
        setFriendStatus(friendshipDocSnap.data().status);
      } else {
        setFriendStatus("none");
      }


    setLoading(false);
    return;
  
    } catch (error) {
      console.error("Error checking friend status:", error);
      setLoading(false);
      return;
    }
  };


  // creates a friend request in the db
  async function sendFriendRequest() {
    if (!user) {
      return;
    }
    const id = [user.uid, userProfile].sort().join("_");
    const ref = doc(db, 'friends', id);
  
    await setDoc(ref, {
      sender_id: user.uid,
      receiver_id: userProfile,
      status: 'pending',
      created_at: serverTimestamp(),
      users: [user.uid, userProfile].sort(),
    });
  
    console.log("Friend request sent.");
    setFriendStatus("pending");
  }


  //unsend friend request or unfriend
  async function declineFriendRequest() {
    if(!user){
      return;
    }

    const id = [user.uid, userProfile].sort().join("_")
    const ref = doc(db, 'friends', id);
  
    await deleteDoc(ref);
    setFriendStatus("none");
  }

  const fetchUserProfile = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "friends"),
          where("users", "array-contains", userId),
          where("status", "==", "active")
        );
  
        const totalFriends = await getDocs(q).then(snapshot => snapshot.size);
  
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          console.error('User profile not found');
          return;
        }
  
        const userData = userDoc.data();
        setUserProfile({
          userName: userData.username,
          avatarUrl: userData.avatar_url,
          name: userData.name,
          bio: userData.bio,
          friendCount: totalFriends,
          coins: userData.coins,
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
  
    const fetchInterests = async () => {
      if (!user) return;
      try {
        const interestsRef = query(
          collection(db, 'users', userId, 'interests'),
          orderBy('created_at', 'desc')
        );
        const interestsSnap = await getDocs(interestsRef);
        const interests = interestsSnap.docs
          .map(doc => ({ 
            id: doc.id,
            caption: doc.data().caption,
            imageUrl: doc.data().image_url,
            createdAt: doc.data().created_at.toDate().toISOString()
          }));
  
        setInterests(interests);
      } catch (error) {
        console.error('Error fetching interests:', error);
      }
    };

  const fetchPinnedGames = async () => {
      if (!user) return;
      try {
        const pinnedGamesRef = collection(db, 'users', userId, 'pinned_games');
        const pinnedGamesSnap = await getDocs(pinnedGamesRef);
        let battle: Battle[] = [];
        pinnedGamesSnap.forEach(doc => {
          const data = doc.data();
          battle.push({
            id: doc.id,
            thumbnail: data.thumbnail,
            title: data.title
          });
        });
  
        setPinnedGames(battle);
      } catch (error) {
        console.error('Error fetching pinned games:', error);
      }
    };

  useEffect(() => {
    console.log("friend status", friendStatus);
  }, [friendStatus]);

  return (
    <View>
      {loading ? (
        <ActivityIndicator/>
      ) : (
        <View>
          {userProfile ? (
            <View>
              <Image
                source={{ uri: userProfile.avatarUrl }}
                style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
              />
              <Text style={{ fontWeight: 'bold' }}>username: {userProfile.userName}</Text>
              <Text style={{ color: '#666' }}>name: {userProfile.name}</Text>
              <Text style={{ color: '#666' }}>bio: {userProfile.bio}</Text>
              <Text style={{ color: '#666' }}>coins: {userProfile.coins}</Text>
              <Button title={`${userProfile.friendCount} Friends`} onPress={() => navigation.navigate('FriendsList', {userId: userId})}/>

              {friendStatus === "active" ? (
                <Button title="Unfriend" onPress={declineFriendRequest}/>
              ) : friendStatus === "pending" ? (
                <Button title="Pending" onPress={declineFriendRequest}/>
              ) : (
                <Button title="Friend" onPress={sendFriendRequest}/>
              )}

              {pinnedGames.length > 0 && (
              <ScrollView horizontal={true} style={{ marginLeft: 10 }}>
                  {pinnedGames
                  .map((battle) => (
                      <View key={battle.id} style={{ flexDirection: 'column', alignItems: 'center', marginRight: 10 }}>
                        <TouchableOpacity onPress={() => {setSelectedGame(battle); setType('pinned'); setShowSubmissions(true);}} style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                          <Image
                          source={{ uri: battle.thumbnail }}
                          style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
                          />
                          <Text>{battle.title}</Text>
                        </TouchableOpacity>
                      </View>
                  ))}
              </ScrollView>
            )}

            {interests.length > 0 && (
              <ScrollView horizontal={true} style={{ marginLeft: 10 }}>
                  {interests
                  .map((interest, index) => (
                    <View key={interest.id} style={{ flexDirection: 'column', alignItems: 'center', marginBottom: 10, }}>
                          <View style={{ flexDirection: 'column', alignItems: 'center', marginRight: 10 }}>
                          <TouchableOpacity onPress={() => { setIndex(index); setType('interests'); setShowSubmissions(true);}}>
                            <Image
                              source={{ uri: interest.imageUrl?.[0].uri }}
                              style={{ width: 150, aspectRatio: 1, marginRight: 10 }}
                            />
                            </TouchableOpacity>
                            </View>
                    </View>
                  ))}
              </ScrollView>
            )}

            <Modal
              animationType="slide"
              transparent={true}
              visible={showSubmissions}
              onRequestClose={() => setShowSubmissions(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Button title="X" onPress={() => setShowSubmissions(false)} />
                    {type === 'interests' ? (
                      <PostView interests={interests} type={type} startIndex={index} userId={userId}/>
                    ) : (
                      <PostView battleId={selectedGame?.id || ''} dare={selectedGame?.title || ''} type={type} userId={userId}/>
                    )}
                </View>
              </View>
            </Modal>

            </View>
          ) : (
            <ActivityIndicator size="large" color="#0000ff" />
          )}

        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    height: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5, // For Android shadow
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
});