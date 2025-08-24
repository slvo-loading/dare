import { View, Text, Button, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, SafeAreaView } from "react-native";
import { ProfileStackProps } from '../../types';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc, 
    deleteDoc, 
    setDoc, 
    serverTimestamp,
    updateDoc,
    documentId,
 } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import React, { useEffect, useState } from 'react';

type Friend = {
    uid: string;
    userName: string;
    avatarUrl: string;
    name: string;
    status: string;
    last_active: any;
};

export default function FriendsList({ navigation, route }: ProfileStackProps<'FriendsList'>) {
    const { userId } = route.params;
    const { user } = useAuth();
    const self = user?.uid === userId;
    const [friendsList, setFriendsList] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
    const [searchUid, setSearchUid] = useState<string>('');
    const [searchLoading, setSearchLoading] = useState<boolean>(false);
    const [searchUser, setSearchUser] = useState<Friend | null>(null);

    useEffect(() => {
        fetchFriends();
      }, []);

    const fetchFriends = async () => {
        if (!userId) return;
        
        try {
            // 1. Get all active friendships (both sent and received)
            const q = query(collection(db, "friends"), where("users", "array-contains", userId));
        
            const querySnapshot = await getDocs(q);

            const friendsList: string[] = [];
            const pendingInList: string[] = [];


            querySnapshot.forEach(doc => {
            const data = doc.data();
            const sender = data.sender_id === userId;
            if (sender) {
                if (data.status === "active") {
                    friendsList.push(data.receiver_id);
                }
            } else {
                if (data.status === "active") {
                    friendsList.push(data.sender_id);
                } else if (data.status === "pending") {
                    pendingInList.push(data.sender_id);
                }
            }
            });

            const chunkSize = 10;

            if (pendingInList.length > 0) {
                const chunks = [];
                for (let i = 0; i < pendingInList.length; i += chunkSize) {
                    chunks.push(pendingInList.slice(i, i + chunkSize));
                }

                const friendData: Friend[] = [];
                for (const chunk of chunks) {
                    const q = query(collection(db, "users"), where(documentId(), "in", chunk));
                    const querySnapshot = await getDocs(q);

                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        friendData.push({
                        uid: doc.id,
                        userName: data.username,
                        avatarUrl: data.avatar_url,
                        name: data.name,
                        status: "active",
                        last_active: data.last_active,
                        });
                    });
                }

                setPendingRequests(friendData)   
            }

            if (friendsList.length > 0) {
                const chunks = [];
                for (let i = 0; i < friendsList.length; i += chunkSize) {
                    chunks.push(friendsList.slice(i, i + chunkSize));
                }

                const friendData: Friend[] = [];
                for (const chunk of chunks) {
                    const q = query(collection(db, "users"), where(documentId(), "in", chunk));
                    const querySnapshot = await getDocs(q);

                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        friendData.push({
                        uid: doc.id,
                        userName: data.username,
                        avatarUrl: data.avatar_url,
                        name: data.name,
                        status: "active",
                        last_active: data.last_active,
                        });
                    });
                }

                setFriendsList(friendData)   
            }

        
        } catch (err) {
            console.error("Error fetching friends:", err);
        }
    };


    const unfriendUser = async (friendId: string) => {
        if(!userId) return;
        if(!friendId) return;

        const id = [userId, friendId].sort().join("_");
        const ref = doc(db, 'friends', id);
        await deleteDoc(ref);

        setPendingRequests((prev) =>
            prev.filter((friend) => friend && friend.uid !== friendId)
        );
        setFriendsList((prev) =>
            prev.filter((friend) => friend && friend.uid !== friendId)
        );

        if(searchUser && searchUser.uid === friendId) {
            setSearchUser((prev) => prev ? { ...prev, status: "none" } : null);
        }
    };

    //sends a friend request
    const sendFriendRequest = async (friendId: string) => {
        if (!userId) {
          return;
        }
        const id = [userId, friendId].sort().join("_");
        const ref = doc(db, 'friends', id);
      
        await setDoc(ref, {
          sender_id: userId,
          receiver_id: friendId,
          status: 'pending',
          created_at: serverTimestamp(),
          users: [userId, friendId],
        });
      
        console.log("Friend request sent.");
        setFriendsList((prev) =>
            prev.map((friend) =>
              friend && friend.uid === friendId ? { ...friend, status: "pending" } : friend
            )
        );

        if(searchUser && searchUser.uid === friendId) {
            setSearchUser((prev) => prev ? { ...prev, status: "pending" } : null);
        }
    }

    const acceptRequest = async (friendId: string) => {
    if (!userId) return;

    const id = [userId, friendId].sort().join("_");
    const ref = doc(db, 'friends', id);

    await updateDoc(ref, {
        status: 'active',
    });

    console.log("Friend request accepted.");

    setFriendsList((prev) => {
        // Get the friend from pending requests
        const acceptedFriend = pendingRequests.find((friend) => friend.uid === friendId);
        if (acceptedFriend) {
          return [acceptedFriend, ...prev];
        }
        return prev;
    });

    setPendingRequests((prev) =>
        prev.filter((friend) => friend && friend.uid !== friendId)
    );
    };


    const onViewProfile = (friendId: string) => {
    navigation.navigate('OtherProfiles', { userId: friendId });
    };

    const handleSearchUid = async (enteredUid: string) => {
        if (!userId || enteredUid === userId) {
            console.log("User not authenticated.");
            return;
        }

        setSearchUser(null);
        
        if(!enteredUid.trim()) {
            console.log("Please enter a valid UID.");
            return;
        }

        console.log("Searching for user with UID:", enteredUid);
        
        setSearchLoading(true);
        const usersRef = doc(db, "users", enteredUid);
        const userDoc = await getDoc(usersRef);

        if (!userDoc.exists()) {
            console.log("No user found with this UID.");
            setSearchLoading(false);
            return;
        }
        const userData = userDoc.data();

        const id = [userId, enteredUid].sort().join("_");
        const ref = doc(db, 'friends', id);
        const snapshot = await getDoc(ref);
        const status = snapshot.exists() ? snapshot.data().status : 'none';

        setSearchUser({
            uid: userDoc.id,
            userName: userData.username,
            avatarUrl: userData.avatar_url,
            name: userData.name,
            status: status,
            last_active: userData.last_active,
        });
        setSearchLoading(false);
        setSearchUid('');
    }


  return (
    <SafeAreaView>
        <Button title="Back" onPress={() => navigation.goBack()}/>
        {self && (
            <View>
        <Text>Incoming requests</Text>
        <ScrollView>
            {pendingRequests
            .filter((friend) => friend !== null)
            .map((friend) => (
                <View key={friend?.uid} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <TouchableOpacity onPress={() => onViewProfile(friend!.uid)}>
                    <Image
                    source={{ uri: friend!.avatarUrl }}
                    style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => onViewProfile(friend!.uid)}>
                    <Text style={{ fontWeight: 'bold' }}>{friend!.userName}</Text>
                    <Text style={{ color: '#666' }}>{friend!.name}</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center'}}>
                    <TouchableOpacity onPress={() => acceptRequest(friend!.uid)}>
                        <Text style={{ color: 'blue' }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => unfriendUser(friend!.uid)}>
                        <Text style={{ color: 'red' }}>Decline</Text>
                    </TouchableOpacity>
                </View>
                </View>
            ))}
        </ScrollView>
        </View>
        )}

        <Text>All Friends</Text>
        <ScrollView>
            {friendsList
            .filter((friend) => friend !== null)
            .map((friend) => (
                <View key={friend?.uid} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <TouchableOpacity onPress={() => onViewProfile(friend!.uid)}>
                    <Image
                    source={{ uri: friend!.avatarUrl }}
                    style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => onViewProfile(friend!.uid)}>
                    <Text style={{ fontWeight: 'bold' }}>{friend!.userName}</Text>
                    <Text style={{ color: '#666' }}>{friend!.name}</Text>
                </TouchableOpacity>
                {self && (
                    <View>
                {friend.status === 'active'? (
                        <TouchableOpacity onPress={() => unfriendUser(friend!.uid)}>
                        <Text style={{ color: 'red' }}>Unfriend</Text>
                        </TouchableOpacity>
                    ) : friend.status === 'pending'? (
                        <TouchableOpacity onPress={() => unfriendUser(friend!.uid)}>
                        <Text style={{ color: 'blue' }}>Pending</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => sendFriendRequest(friend!.uid)}>
                        <Text style={{ color: 'blue' }}>Friend</Text>
                        </TouchableOpacity>
                    )}
                    </View>
                )}
                </View>
            ))}
        </ScrollView>

        {self && (
        <View>
        <Text>Search for a friend</Text>
        <TextInput
            value={searchUid}
            onChangeText={setSearchUid}
            placeholder="Search for a friend by UID"
            style={{
                borderWidth: 1,
                borderColor: '#ccc',
                padding: 12,
                marginBottom: 12,
            }}
        />
        <Button title="Search for friends" onPress={() => {handleSearchUid(searchUid)}}/>
        {!searchLoading ? (
            <View>
            {searchUser && (
                <View key={searchUser.uid} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <TouchableOpacity onPress={() => onViewProfile(searchUser.uid)}>
                        <Image
                        source={{ uri: searchUser.avatarUrl }}
                        style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => onViewProfile(searchUser.uid)}>
                        <Text style={{ fontWeight: 'bold' }}>{searchUser.userName}</Text>
                        <Text style={{ color: '#666' }}>{searchUser.name}</Text>
                    </TouchableOpacity>
                    {searchUser.status === 'active'? (
                        <TouchableOpacity onPress={() => unfriendUser(searchUser.uid)}>
                        <Text style={{ color: 'red' }}>Unfriend</Text>
                        </TouchableOpacity>
                    ) : searchUser.status === 'pending'? (
                        <TouchableOpacity onPress={() => unfriendUser(searchUser.uid)}>
                        <Text style={{ color: 'blue' }}>Pending</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => sendFriendRequest(searchUser.uid)}>
                        <Text style={{ color: 'blue' }}>Friend</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
            </View>
        ): ( <ActivityIndicator size="large" color="#0000ff" /> )}
        </View>
        )}
    </SafeAreaView>
  );
}
