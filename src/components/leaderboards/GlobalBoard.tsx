import { SafeAreaView, View, Text, Button, TouchableOpacity, Image, ScrollView } from "react-native";
import { LeaderboardProps } from "../../types";
import React, { useState, useEffect } from "react";
import { db } from "../../../firebaseConfig";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

type Users = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string;
  coins: number;
}

export default function GlobalBoard({ navigation }: LeaderboardProps<'GlobalBoard'>) {
  const [users, setUsers] = useState<Users[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('coins', 'desc'),
      )

      const querySnapshot = await getDocs(q);
      const usersList: Users[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersList.push({
          id: doc.id,
          username: data.username || '',
          name: data.name || '',
          avatarUrl: data.avatar_url || '',
          coins: data.coins || 0,
        });
      });

      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }

  }

  const onViewProfile = (userId: string) => {
    navigation.navigate('OtherProfiles', { userId: userId });
  }

  return (
    <SafeAreaView>
      <ScrollView>
                {users
                  .filter((user) => user !== null)
                  .map((user, index) => (
                      <View key={user.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Text>{index + 1}</Text>
                      <TouchableOpacity onPress={() => onViewProfile(user.id)}>
                          <Image
                          source={{ uri: user.avatarUrl }}
                          style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
                          />
                      </TouchableOpacity>
                      <TouchableOpacity style={{ flex: 1 }} onPress={() => onViewProfile(user.id)}>
                          <Text style={{ fontWeight: 'bold' }}>{user.username}</Text>
                          <Text style={{ color: '#666' }}>{user.name}</Text>
                      </TouchableOpacity>
                      <Text style={{ color: '#666', marginRight: 10 }}>{user.coins} coins</Text>
                      </View>
                ))}
              </ScrollView>
    </SafeAreaView>
  );
}