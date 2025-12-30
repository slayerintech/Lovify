import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, Dimensions, StatusBar } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const CARD_WIDTH = (width - 60) / COLUMN_COUNT;

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
      activeOpacity={0.8}
      style={styles.cardWrapper}
      onPress={() => navigation.navigate('Chat', { matchId: item.id, user: item.otherUser })}
    >
      <View style={styles.glassCard}>
        <Image source={{ uri: item.otherUser.photos[0] }} style={styles.cardImage} />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.cardGradient}
        >
          <BlurView intensity={20} tint="dark" style={styles.nameBadge}>
            <Text style={styles.nameText} numberOfLines={1}>
              {item.otherUser.displayName || item.otherUser.name}
            </Text>
            <View style={styles.onlineDot} />
          </BlurView>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000', '#0a0a0a', '#121212']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea}>
        <AppHeader />

        <FlatList
          data={matches}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<Text style={styles.sectionTitle}>Your Matches</Text>}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="heart-dislike-outline" size={60} color="rgba(255,255,255,0.2)" />
              </View>
              <Text style={styles.emptyText}>No flames yet.</Text>
              <Text style={styles.emptySubText}>Keep swiping to find your match!</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100, // For TabBar space
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF2D55',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 5,
    marginBottom: 15,
    marginTop: 10,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    margin: 5,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  glassCard: {
    flex: 1,
    backgroundColor: '#1c1c1e',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '50%',
    justifyContent: 'flex-end',
    padding: 10,
  },
  nameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nameText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#32D74B',
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,45,85,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptySubText: {
    color: '#8E8E93',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});