import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { COLORS, GRADIENTS } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';

export default function MatchesScreen() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'matches'), where('users', 'array-contains', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMatches = snapshot.docs.map(doc => {
        const data = doc.data();
        const otherUserId = data.users.find((id) => id !== user.uid);
        const otherUserData = data.usersData[otherUserId];
        return {
          id: doc.id,
          ...data,
          otherUser: otherUserData,
        };
      });
      setMatches(fetchedMatches);
    });

    return () => unsubscribe();
  }, [user]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.matchItem}
      onPress={() => navigation.navigate('Chat', { matchId: item.id, user: item.otherUser })}
    >
      <Image source={{ uri: item.otherUser.photos[0] }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.otherUser.name}</Text>
        <Text style={styles.preview}>Say hello!</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Matches</Text>
        <FlatList
          data={matches}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No matches yet. Keep swiping!</Text>
            </View>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: COLORS.white,
    padding: 20,
  },
  list: {
    padding: 20,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  preview: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});
