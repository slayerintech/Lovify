import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

import { useAuth } from '../services/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import CreateProfileScreen from '../screens/CreateProfileScreen';
import HomeScreen from '../screens/HomeScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ChatsScreen from '../screens/ChatsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Premium iOS Glass Background
const GlassTabBarBackground = () => (
  <BlurView
    tint="dark"
    intensity={80}
    style={StyleSheet.absoluteFill}
  />
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarBackground: GlassTabBarBackground,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 30 : 8,
          left: 25,
          right: 25,
          height: 70, // Slightly increased for better balance
          borderRadius: 35,
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.12)',
          elevation: 0,
          overflow: 'hidden',
        },
        tabBarActiveTintColor: '#FF2D55',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.35)',
        // Important: Centering and Padding
        tabBarItemStyle: {
          height: 100,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: Platform.OS === 'ios' ? 0 : 15// Fine-tuning for Android
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          const iconSize = 32

          if (route.name === 'Home') {
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'Matches') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Chats') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return (
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={iconSize} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color="#FF2D55" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: '#000' }
        }}
      >
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !userData ? (
          <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="EditProfile"  
              component={EditProfileScreen} 
              options={{ 
                presentation: 'modal',
                headerShown: false,
              }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  iconContainer: {
    // Icons ko vertically aur horizontally center karne ke liye
    alignItems: 'center',
    justifyContent: 'center',
    height: '130%',
    width: '100%',
    // iOS safe area spacing adjust karne ke liye padding
    paddingTop: Platform.OS === 'ios' ? 15 : 0, 
  },
});