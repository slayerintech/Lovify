import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, doc, setDoc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { TinderCard } from '../components/TinderCard';
import { MatchModal } from '../components/MatchModal';
import { COLORS, GRADIENTS } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const { user, userData } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    if (!user || !userData) return;

    try {
      // 1. Get IDs of users already liked/disliked
      const likesSnapshot = await getDocs(collection(db, 'likes', user.uid, 'liked'));
      const passedUserIds = likesSnapshot.docs.map(doc => doc.id);
      passedUserIds.push(user.uid); // Exclude self

      // 2. Fetch users based on interest
      let q;
      if (userData.interestedIn === 'both') {
        q = query(collection(db, 'users'));
      } else {
        q = query(collection(db, 'users'), where('gender', '==', userData.interestedIn));
      }

      const usersSnapshot = await getDocs(q);
      const fetchedProfiles = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((profile) => !passedUserIds.includes(profile.id));

      setProfiles(fetchedProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const swipeLeft = async (cardIndex) => {
    if (!profiles[cardIndex]) return;
    const userSwiped = profiles[cardIndex];
    
    // Record Dislike
    await setDoc(doc(db, 'likes', user.uid, 'liked', userSwiped.id), {
      type: 'dislike',
      timestamp: serverTimestamp(),
    });

    // Remove card from state (handled by UI but good to sync)
  };

  const swipeRight = async (cardIndex) => {
    if (!profiles[cardIndex]) return;
    const userSwiped = profiles[cardIndex];

    // Record Like
    await setDoc(doc(db, 'likes', user.uid, 'liked', userSwiped.id), {
      type: 'like',
      timestamp: serverTimestamp(),
    });

    // Check for Match
    const likedBackSnapshot = await getDoc(doc(db, 'likes', userSwiped.id, 'liked', user.uid));
    if (likedBackSnapshot.exists() && likedBackSnapshot.data().type === 'like') {
      // It's a Match!
      const matchData = {
        users: [user.uid, userSwiped.id],
        usersData: {
          [user.uid]: userData,
          [userSwiped.id]: userSwiped,
        },
        createdAt: serverTimestamp(),
      };
      
      const matchRef = await addDoc(collection(db, 'matches'), matchData);
      
      setLastMatch({ ...userSwiped, matchId: matchRef.id });
      setMatchModalVisible(true);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cardsContainer}>
          {profiles.length > 0 ? (
            profiles.map((profile, index) => (
              <TinderCard
                key={profile.id}
                user={profile}
                onSwipeLeft={() => swipeLeft(index)}
                onSwipeRight={() => swipeRight(index)}
              />
            )).reverse() 
          ) : (
            <View style={styles.noMoreCards}>
              <Text style={styles.noMoreText}>No more profiles to show.</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      <MatchModal
        visible={matchModalVisible}
        currentUser={userData}
        matchedUser={lastMatch}
        onClose={() => setMatchModalVisible(false)}
        onChat={() => {
          setMatchModalVisible(false);
          navigation.navigate('Chat', { matchId: lastMatch.matchId, user: lastMatch });
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
    paddingTop: 40,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMoreCards: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMoreText: {
    color: COLORS.textSecondary,
    fontSize: 18,
  },
});
