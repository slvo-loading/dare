import { View, Text, Button, ScrollView, TouchableOpacity, Image } from "react-native";
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

export default function FriendsList({ navigation }: ProfileStackProps<'FriendsList'>) {
    const { user } = useAuth();
    const [friendsList, setFriendsList] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);

    useEffect(() => {
        fetchFriends();
      }, []);

    const fetchFriends = async () => {
        if (!user) return;
        
        try {
            // 1. Get all active friendships (both sent and received)
            const sentQuery = query(collection(db, "friends"), where("sender_id", "==", user.uid), where("status", "==", "active"));
            const receivedQuery = query(collection(db, "friends"), where("receiver_id", "==", user.uid), where("status", "==", "active"));
        
            const [sentSnap, receivedSnap] = await Promise.all([
            getDocs(sentQuery),
            getDocs(receivedQuery),
            ]);

            // 2. Extract the other person’s ID in each case
            const friendIds: string[] = [];
        
            sentSnap.forEach(doc => {
            const data = doc.data();
            friendIds.push(data.receiver_id);
            });
        
            receivedSnap.forEach(doc => {
            const data = doc.data();
            friendIds.push(data.sender_id);
            });
        
            // 3. Fetch user info for each friend
            const friendData = await Promise.all(
            friendIds.map(async (id) => {
                const userDoc = await getDoc(doc(db, "users", id));
                if (userDoc.exists()) {
                const data = userDoc.data();
                return {
                    uid: id,
                    userName: data.username,
                    avatarUrl: data.avatar_url,
                    name: data.name,
                    status: "active",
                    last_active: data.last_active,
                };
                }
                return null;
            })
            );
        
            // 4. Clean out nulls and sort based on last active time
            const filteredFriend = friendData
            .filter((friend): friend is Friend => friend !== null)
            .sort((a, b) => {
                const aTime = a.last_active?.toMillis?.() || 0;
                const bTime = b.last_active?.toMillis?.() || 0;
                return bTime - aTime
            });
        
            // 5. Save to state
            setFriendsList(filteredFriend);
        
        } catch (err) {
            console.error("Error fetching friends:", err);
        }
    };


    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        if (!user) return;
        
        try {
            // 1. Get all pending requests friendships
            const receivedQuery = query(collection(db, "friends"), where("receiver_id", "==", user.uid), where("status", "==", "pending"));
        
            const [sentSnap] = await Promise.all([
            getDocs(receivedQuery),
            ]);

            // 2. Extract the other person’s ID in each case
            const friendIds: string[] = [];
        
            sentSnap.forEach(doc => {
            const data = doc.data();
            friendIds.push(data.sender_id);
            });
        
            // 3. Fetch user info for each friend
            const friendData = await Promise.all(
            friendIds.map(async (id) => {
                const userDoc = await getDoc(doc(db, "users", id));
                if (userDoc.exists()) {
                const data = userDoc.data();
                return {
                    uid: id,
                    userName: data.username,
                    avatarUrl: data.avatar_url,
                    name: data.name,
                    status: "pending",
                    last_active: data.last_active,
                };
                }
                return null;
            })
            );
        
            // 4. Clean out nulls and sort based on last active time
            const filteredFriend = friendData
            .filter((friend): friend is Friend => friend !== null)
            .sort((a, b) => {
                const aTime = a.last_active?.toMillis?.() || 0;
                const bTime = b.last_active?.toMillis?.() || 0;
                return bTime - aTime
            });
        
            // 5. Save to state
            setPendingRequests(filteredFriend);
        
        } catch (err) {
            console.error("Error fetching requests:", err);
        }
    };


    const unfriendUser = async (friendId: string) => {
        if(!user) return;
        if(!friendId) return;

        const id = [user.uid, friendId].sort().join("_");
        const ref = doc(db, 'friends', id);
        await deleteDoc(ref);

        fetchPendingRequests();
    };

    //sends a friend request
    const sendFriendRequest = async (friendId: string) => {
        if (!user) {
          return;
        }
        const id = [user.uid, friendId].sort().join("_");
        const ref = doc(db, 'friends', id);
      
        await setDoc(ref, {
          sender_id: user.uid,
          receiver_id: friendId,
          status: 'pending',
          created_at: serverTimestamp(),
        });
      
        console.log("Friend request sent.");
        setFriendsList((prev) =>
            prev.map((friend) =>
              friend && friend.uid === friendId ? { ...friend, status: "pending" } : friend
            )
        );
    }

    const acceptRequest = async (friendId: string) => {
    if (!user) return;

    const id = [user.uid, friendId].sort().join("_");
    const ref = doc(db, 'friends', id);

    await updateDoc(ref, {
        status: 'active',
    });

    console.log("Friend request accepted.");

    fetchPendingRequests();
    fetchFriends();
    };


    const onViewProfile = (friendId: string) => {
    navigation.navigate('OtherProfiles', { userId: friendId });
    };

    useEffect(() => {
        console.log('Friends List:', friendsList);
    }, [friendsList]);


  return (
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
            ))}
        </ScrollView>
        <Button title="1234" onPress={() => navigation.navigate('OtherProfiles', { userId: '1234' })} />
        <Button title="2345" onPress={() => navigation.navigate('OtherProfiles', { userId: '2345' })} />
        <Button title="3456" onPress={() => navigation.navigate('OtherProfiles', { userId: '3456' })} />
        <Button title="4567" onPress={() => navigation.navigate('OtherProfiles', { userId: '4567' })} />
    </View>
  );
}
