import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../styles/theme';

export const GlassChip = ({ label, selected, onPress }) => {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.container,
      { opacity: pressed ? 0.8 : 1 }
    ]}>
      {selected ? (
        <LinearGradient
          colors={['#6e33b1', '#c0b4e3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
      )}
      
      <Text style={[
        styles.text,
        selected && styles.selectedText
      ]}>
        {label}
      </Text>
      
      {!selected && (
        <LinearGradient
          colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
          style={styles.border}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    overflow: 'hidden',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
    zIndex: 1,
  },
  selectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 20,
  },
});
