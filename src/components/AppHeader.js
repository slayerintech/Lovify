import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const THEME_ACCENT = '#FF2D55';

export const AppHeader = ({ onPress, title = 'Lovify' }) => {
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
    <View style={styles.headerContainer}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={onPress} 
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient colors={[THEME_ACCENT, '#ff5e7d']} style={styles.logoCircle}>
            <Ionicons name="heart" size={18} color="white" />
          </LinearGradient>
        </Animated.View>
        <Text style={styles.logoText}>{title}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? 40 : 10,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME_ACCENT,
    marginLeft: 8,
    letterSpacing: -0.5,
  },
});
