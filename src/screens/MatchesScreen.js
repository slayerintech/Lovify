import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import StorageService from '../services/StorageService';
import { AppHeader } from '../components/AppHeader';
import { PurchaseModal } from '../components/PurchaseModal';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MatchesBanner } from '../services/AdService';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const CARD_WIDTH = (width - 60) / COLUMN_COUNT;

export default function MatchesScreen() {
  const { user, userData } = useAuth();
  const [matches, setMatches] = useState([]);
  const [whoLikedMe, setWhoLikedMe] = useState([]);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [showLocked, setShowLocked] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (!user) return;

    // 1. Fetch real matches (mutual likes)
    const matchesQuery = query(collection(db, 'matches'), where('users', 'array-contains', user.uid));
    const unsubscribeMatches = onSnapshot(matchesQuery, (snapshot) => {
      const fetchedMatches = snapshot.docs.map(doc => {
        const data = doc.data();
        const otherUserId = data.users.find((id) => id !== user.uid);
        const otherUserData = data.usersData[otherUserId];
        return {
          id: doc.id,
          ...data,
          otherUser: otherUserData,
          type: 'match'
        };
      });
      setMatches(fetchedMatches);
    });

    // 2. Fetch people who liked the current user
    const likesQuery = collection(db, 'users', user.uid, 'whoLikedMe');
    const unsubscribeLikes = onSnapshot(likesQuery, (snapshot) => {
      const fetchedLikes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'like_received'
      }));
      setWhoLikedMe(fetchedLikes);
    });

    return () => {
      unsubscribeMatches();
      unsubscribeLikes();
    };
  }, [user]);

  const renderItem = ({ item }) => {
    const isPremium = userData?.isPremium;

    if (item.type === 'like_received') {
      return (
        <TouchableOpacity 
          activeOpacity={0.9}
          style={styles.cardWrapper}
          onPress={() => isPremium ? navigation.navigate('UserProfile', { userId: item.id }) : setPurchaseModalVisible(true)}
        >
          <View style={styles.glassCard}>
            <Image 
              source={{ uri: item.photo }} 
              style={[styles.cardImage, !isPremium && { opacity: 0.8 }]} 
              blurRadius={!isPremium ? (Platform.OS === 'ios' ? 60 : 30) : 0}
            />
            {!isPremium && (
              <View style={styles.lockedOverlay}>
                <View style={styles.lockIconCircle}>
                  <Ionicons name="lock-closed" size={24} color="#FF2D55" />
                </View>
                <Text style={styles.lockedTitle}>Liked You!</Text>
                <Text style={styles.lockedSubtitle}>Tap to unlock</Text>
              </View>
            )}
            {isPremium && (
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.9)']}
                style={styles.cardGradient}
              >
                <BlurView intensity={20} tint="dark" style={styles.nameBadge}>
                  <Text style={styles.nameText} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={[styles.onlineDot, { backgroundColor: '#FFD700' }]} />
                </BlurView>
              </LinearGradient>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return (
    <TouchableOpacity 
      activeOpacity={0.8}
      style={styles.cardWrapper}
      onPress={() => navigation.navigate('Conversation', { matchId: item.id, user: item.otherUser })}
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
  };

  // Combine real matches and real likes, avoiding duplicates and sorting by time
  const combinedData = (() => {
    // 1. Get all IDs of users we already matched with
    const matchedUserIds = matches.map(m => m.otherUser.id);
    
    // 2. Filter whoLikedMe to remove those who are already in matches
    const uniqueLikes = whoLikedMe.filter(like => !matchedUserIds.includes(like.id));
    
    // 3. Combine and Sort by timestamp (Newest first)
    return [...uniqueLikes, ...matches].sort((a, b) => {
      const timeA = a.timestamp?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
      const timeB = b.timestamp?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  })();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0f0f0f', '#000000', '#1a0b12']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea}>
        <AppHeader style={styles.header} />
        
        <FlatList
          data={combinedData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={COLUMN_COUNT}
          style={{ marginBottom: Platform.OS === 'ios' ? 105 : 83 }}
          contentContainerStyle={[styles.list, { paddingTop: 60 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<Text style={styles.sectionTitle}>{whoLikedMe.length > 0 ? 'Who Liked You & Matches' : 'Your Matches'}</Text>}
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

      <PurchaseModal 
        visible={purchaseModalVisible}
        onClose={() => setPurchaseModalVisible(false)}
        onPurchase={() => {
            setPurchaseModalVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  safeArea: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110, // Increased to stop content before TabBar
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
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  lockIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 85, 0.5)',
  },
  lockedTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  lockedSubtitle: {
    color: '#FF2D55',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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