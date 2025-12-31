import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const THEME_ACCENT = '#FF2D55';

export const AppHeader = ({ onPress, title = 'Lovify', style }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startHeartbeat();
  }, []);

  const startHeartbeat = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  };

  return (
    <BlurView intensity={30} tint="dark" style={[styles.headerContainer, style]}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={onPress} 
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
      >
        <Text style={styles.logoText}>{title}</Text>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient colors={[THEME_ACCENT, '#ff5e7d']} style={styles.logoCircle}>
            <Ionicons name="heart" size={24} color="white" />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 10,
    paddingTop: 33,
    paddingBottom: 10,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 34,
    fontWeight: '800',
    color: THEME_ACCENT,
    letterSpacing: -1,
  },
});
