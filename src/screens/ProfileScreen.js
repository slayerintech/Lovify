import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../services/AuthContext';
import { GlassButton } from '../components/GlassButton';
import { COLORS, GRADIENTS } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const { userData, logout } = useAuth();
  const navigation = useNavigation();

  if (!userData) return null;

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Image source={{ uri: userData.photos[0] }} style={styles.avatar} />
            <Text style={styles.name}>{userData.name}, {userData.age}</Text>
            <Text style={styles.bio}>{userData.bio}</Text>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData.gender}</Text>
              <Text style={styles.statLabel}>Gender</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData.interestedIn}</Text>
              <Text style={styles.statLabel}>Interested In</Text>
            </View>
          </View>

          <GlassButton 
            title="Edit Profile" 
            onPress={() => navigation.navigate('EditProfile')} 
            style={styles.button}
          />
          
          <GlassButton 
            title="Logout" 
            onPress={logout} 
            style={[styles.button, styles.logoutButton]}
            textStyle={{ color: COLORS.error }}
          />
        </ScrollView>
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
  content: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: COLORS.primary,
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 10,
  },
  bio: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    textTransform: 'capitalize',
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  button: {
    width: '100%',
    marginBottom: 15,
  },
  logoutButton: {
    borderColor: COLORS.error,
  },
});
