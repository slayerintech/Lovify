import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, SafeAreaView, Alert, Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import { useAuth } from '../services/AuthContext';
import { GlassButton } from '../components/GlassButton';
import { COLORS } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { seedUsers } from '../utils/seeder';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { userData, logout } = useAuth();
  const navigation = useNavigation();

  const handleSeed = async () => {
    try {
      Alert.alert(
        'Dev Mode: Add Data',
        'Insert 20 virtual profiles?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Insert', 
            onPress: async () => {
              await seedUsers();
              Alert.alert('Success', 'Universe populated with 20 profiles!');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to seed data');
    }
  };

  if (!userData) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1a0b12', '#000000', '#000']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Profile Header with Glass Aura */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <LinearGradient colors={['#FF2D55', '#5856D6']} style={styles.avatarGradient}>
                <Image source={{ uri: userData.photos[0] }} style={styles.avatar} />
              </LinearGradient>
              <TouchableOpacity style={styles.editIconBadge} onPress={() => navigation.navigate('EditProfile')}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.name}>{userData.name}, {userData.age}</Text>
            <BlurView intensity={10} tint="light" style={styles.bioBadge}>
               <Text style={styles.bio}>{userData.bio || "No bio yet. Tell the world who you are!"}</Text>
            </BlurView>
          </View>

          {/* Stats Section: Glass Cards */}
          <View style={styles.statsContainer}>
            <BlurView intensity={20} tint="dark" style={styles.statCard}>
               <Ionicons name="transgender-outline" size={24} color="#FF2D55" />
               <Text style={styles.statValue}>{userData.gender}</Text>
               <Text style={styles.statLabel}>Gender</Text>
            </BlurView>

            <BlurView intensity={20} tint="dark" style={styles.statCard}>
               <Ionicons name="heart-half-outline" size={24} color="#5856D6" />
               <Text style={styles.statValue}>{userData.interestedIn}</Text>
               <Text style={styles.statLabel}>Interests</Text>
            </BlurView>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <Text style={styles.menuTitle}>Account Settings</Text>
            
            <GlassButton 
              title="Edit Profile" 
              onPress={() => navigation.navigate('EditProfile')} 
              style={styles.button}
            />
            
            <GlassButton 
              title="Populate Profiles (Dev)" 
              onPress={handleSeed} 
              style={[styles.button, styles.devButton]}
            />

            <TouchableOpacity style={styles.logoutRow} onPress={logout}>
               <LinearGradient colors={['rgba(255, 45, 85, 0.1)', 'transparent']} style={styles.logoutGradient}>
                  <Ionicons name="log-out-outline" size={22} color="#FF453A" />
                  <Text style={styles.logoutText}>Logout from Lovify</Text>
               </LinearGradient>
            </TouchableOpacity>
          </View>

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
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 120, // Tab bar space
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarGradient: {
    padding: 4,
    borderRadius: 85,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 5,
    borderColor: '#000',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#FF2D55',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  name: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 12,
  },
  bioBadge: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxWidth: width * 0.8,
  },
  bio: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  statCard: {
    flex: 1,
    paddingVertical: 20,
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
    textTransform: 'capitalize',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  actionSection: {
    width: '100%',
    paddingHorizontal: 25,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 20,
    marginLeft: 5,
  },
  button: {
    width: '100%',
    height: 58,
    marginBottom: 15,
  },
  devButton: {
    backgroundColor: 'rgba(50, 215, 75, 0.05)',
    borderColor: 'rgba(50, 215, 75, 0.2)',
  },
  logoutRow: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  logoutText: {
    color: '#FF453A',
    fontSize: 16,
    fontWeight: '700',
  },
});