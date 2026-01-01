import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BannerAd, BannerAdSize, TestIds } from '../utils/AdMob';

export default function ChatsScreen() {
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
        return { id: doc.id, ...data, otherUser: otherUserData };
      });
      setMatches(fetchedMatches);
    });
    return () => unsubscribe();
  }, [user]);

  // Horizontal "New Matches" Header
  const renderNewMatches = () => (
    <View style={styles.newMatchesSection}>
      <Text style={styles.sectionTitle}>New Matches</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
        {matches.map((item) => (
          <View 
            key={item.id} 
            style={styles.newMatchCircle}
          >
            <LinearGradient colors={['#FF2D55', '#FF375F']} style={styles.avatarGlow}>
              <Image source={{ uri: item.otherUser.photos[0] }} style={styles.smallAvatar} />
            </LinearGradient>
            <Text style={styles.matchName} numberOfLines={1}>{item.otherUser.name}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Lovify System User
  const lovifyUser = {
    id: 'lovify_system',
    name: 'Lovify Team',
    photos: ['https://firebasestorage.googleapis.com/v0/b/lovify-2fa76.appspot.com/o/assets%2Flogo.png?alt=media'], // Placeholder for local logo logic
    isSystem: true
  };

  const renderItem = ({ item }) => {
    // Check if it's the Lovify system message
    if (item.id === 'lovify_system') {
      return (
        <TouchableOpacity 
          activeOpacity={0.9}
          style={styles.chatCardWrapper}
          onPress={async () => {
            await AdService.showChatAd();
            Alert.alert("Coming Soon", "Chat feature coming soon");
          }}
        >
          <BlurView intensity={10} tint="dark" style={styles.chatCard}>
            <View style={styles.avatarContainer}>
              <LinearGradient colors={['#FF2D55', '#FF375F']} style={[styles.avatar, styles.systemAvatarContainer]}>
                 <Ionicons name="heart" size={32} color="white" />
              </LinearGradient>
              <View style={[styles.onlineStatus, { backgroundColor: '#FFD700' }]} />
            </View>
            
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.name}>Lovify Team</Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#FF2D55" />
                  </View>
                </View>
              </View>
              <Text style={styles.preview} numberOfLines={1}>
                Upgrade to Pro premium to appear to more...
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
          </BlurView>
        </TouchableOpacity>
      );
    }

    return (
    <View 
      style={styles.chatCardWrapper}
    >
      <BlurView intensity={10} tint="dark" style={styles.chatCard}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.otherUser.photos[0] }} style={styles.avatar} />
          <View style={styles.onlineStatus} />
        </View>
        
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.otherUser.name}</Text>
            <Text style={styles.time}>Now</Text>
          </View>
          <Text style={styles.preview} numberOfLines={1}>
            Tap to start a conversation ✨
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
      </BlurView>
    </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000', '#0a0a0a', '#121212']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea}>
        <AppHeader style={styles.header} />
        <View style={{ paddingTop: 60, alignItems: 'center', paddingBottom: 20 }}>
          <BannerAd unitId={TestIds.BANNER} size={BannerAdSize.BANNER} />
        </View>
        
        <ScrollView contentContainerStyle={{ paddingTop: 0 }}>
          {matches.length > 0 && renderNewMatches()}

          <FlatList
            data={[lovifyUser, ...matches]}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            scrollEnabled={false} // Since we wrapped it in ScrollView
            ListHeaderComponent={<Text style={styles.sectionTitle}>Recent Chats</Text>}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIconBg}>
                  <Ionicons name="chatbubbles-outline" size={50} color="#FF2D55" />
                </View>
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubText}>Start swiping to find someone to talk to!</Text>
              </View>
            }
          />
        </ScrollView>
      </SafeAreaView>
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
  newMatchesSection: {
    marginTop: 20,
    marginBottom: 10,
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
  horizontalScroll: {
    paddingHorizontal: 20,
  },
  newMatchCircle: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 75,
  },
  avatarGlow: {
    padding: 2,
    borderRadius: 35,
    marginBottom: 8,
  },
  smallAvatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: '#000',
  },
  matchName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 100,
    flexGrow: 1,
  },
  chatCardWrapper: {
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    marginRight: 15,
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 2,
    right: 18,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#32D74B',
    borderWidth: 3,
    borderColor: '#000',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  systemAvatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    marginLeft: 2,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  time: {
    fontSize: 12,
    color: '#8E8E93',
  },
  preview: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // marginTop: 60, // Removed to center vertically
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,45,85,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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