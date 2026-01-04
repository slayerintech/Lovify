import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [showLocked, setShowLocked] = useState(false);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      if (!user || userData?.isPremium) {
          setShowLocked(false);
          return;
      }

      let unsubscribe = null;
      let isMounted = true;

      const setup = async () => {
          try {
              // Check if user has visited matches screen before
              const visitedKey = `hasVisitedMatches_${user.uid}`;
              const hasVisited = await AsyncStorage.getItem(visitedKey);
              
              // Mark as visited for NEXT time
              if (hasVisited !== 'true') {
                  await AsyncStorage.setItem(visitedKey, 'true');
              }

              // Only show locked match if this is NOT the first visit (hasVisited was already true)
              const shouldShowLocked = hasVisited === 'true';

              if (isMounted) {
                  setShowLocked(shouldShowLocked);
              }
          } catch (e) {
              console.error("Error in MatchesScreen setup", e);
          }
      };

      setup();
      
      return () => {
          isMounted = false;
          if (unsubscribe) unsubscribe();
      };
    }, [user, userData])
  );

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

  const renderItem = ({ item }) => {
    if (item.id === 'locked_match') {
      return (
        <TouchableOpacity 
          activeOpacity={0.9}
          style={styles.cardWrapper}
          onPress={() => setPurchaseModalVisible(true)}
        >
          <View style={styles.glassCard}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80' }} 
              style={[styles.cardImage, { opacity: 0.8 }]} 
              blurRadius={Platform.OS === 'ios' ? 60 : 30}
            />
            <View style={styles.lockedOverlay}>
              <View style={styles.lockIconCircle}>
                <Ionicons name="lock-closed" size={24} color="#FF2D55" />
              </View>
              <Text style={styles.lockedTitle}>Someone liked you!</Text>
              <Text style={styles.lockedSubtitle}>Tap to unlock</Text>
            </View>
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

  // Determine if we should show the locked match
  const data = showLocked ? [{ id: 'locked_match' }, ...matches] : matches;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000', '#0a0a0a', '#121212']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea}>
        <AppHeader style={styles.header} />
        <View style={{ paddingTop: 60, alignItems: 'center', paddingBottom: 20, width: '100%' }}>
          <MatchesBanner />
        </View>
        
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={[styles.list, { paddingTop: 10 }]}
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

      <PurchaseModal 
        visible={purchaseModalVisible}
        onClose={() => setPurchaseModalVisible(false)}
        onPurchase={() => {
            setPurchaseModalVisible(false);
            // Add navigation to purchase or actual purchase logic here
            // For now, let's just close it, assuming PurchaseModal handles the purchase flow
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