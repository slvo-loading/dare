import { View, Text, Button, ActivityIndicator } from "react-native";
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from "../../context/AuthContext";
import { db } from "../../../firebaseConfig";
import { query, where, deleteDoc, getDocs, collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import React, { useState, useEffect } from "react";

type OtherProfilesRouteParams = {
    userId: string;
};
  
type OtherProfilesRouteProp = RouteProp<
    { OtherProfiles: OtherProfilesRouteParams },
    'OtherProfiles'
>;

export default function OtherProfiles() {
  const route = useRoute<OtherProfilesRouteProp>();
  const [userProfile, setUserProfile] = useState(route.params.userId); // is just uid for now
  const [friendStatus, setFriendStatus] = useState<string | null>(null); // "none", "pending", "accepted", or "incoming"
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();


// on mount gets the friend status of the other profile
  useEffect(() => {
    checkFriendStatus();
  }, [user?.uid, userProfile]);


  // checks the whether the userProfile is a friend to the user
  const checkFriendStatus = async () => {
    if (!user) {return}

    // gets docs for bi-directional friendship status
    const q = query(
      collection(db, "friends"),
      where("sender_id", "in", [user.uid, userProfile]),
      where("receiver_id", "in", [user.uid, userProfile])
    );

    const snapshot = await getDocs(q);
    let status = "none";

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === "pending") {
        // status = data.sender_id === user.uid ? "pending" : "incoming";
        status = "pending";
      } else if (data.status === "active") {
        status = "active";
      }
    });

    setFriendStatus(status);
    setLoading(false);
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

  useEffect(() => {
    console.log("Friend status:", friendStatus);
  }, [friendStatus]);
  

  return (
    <View>
      {loading ? (
        <ActivityIndicator/>
      ) : (
        <View>
          <Text>other Profiles {userProfile}</Text>
          {friendStatus === "active" ? (
            <Button title="Unfriend" onPress={declineFriendRequest}/>
          ) : friendStatus === "pending" ? (
            <Button title="Pending" onPress={declineFriendRequest}/>
          ) : (
            <Button title="Friend" onPress={sendFriendRequest}/>
          )}
        </View>
      )}
    </View>
  );
};