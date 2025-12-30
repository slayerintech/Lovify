import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme';

export const GlassChip = ({ label, icon, selected, onPress, style }) => {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.container,
      style,
      { opacity: pressed ? 0.8 : 1 }
    ]}>
      {selected ? (
        <LinearGradient
          colors={['#FF2D55', '#FF6B8B']} // Updated to match app theme (pink/red)
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      
      <View style={styles.content}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={18} 
            color={selected ? '#fff' : 'rgba(255,255,255,0.7)'} 
            style={styles.icon}
          />
        )}
        <Text style={[
          styles.text,
          selected && styles.selectedText
        ]}>
          {label}
        </Text>
      </View>
      
      {!selected && (
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
          style={styles.border}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 10,
    overflow: 'hidden',
    minWidth: 90,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1,
    gap: 6,
  },
  text: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '700',
  },
  icon: {
    marginTop: -1,
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
});
