import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme';

export const GlassChip = ({ 
  label, 
  icon, 
  selected, 
  onPress, 
  style, 
  gradientColors = ['#FF2D55', '#FF6B8B'],
  borderColor = 'rgba(255,255,255,0.1)'
}) => {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.container,
      style,
      { 
        opacity: pressed ? 0.8 : 1,
        borderColor: selected ? (borderColor !== 'rgba(255,255,255,0.1)' ? borderColor : 'rgba(255,255,255,0.2)') : borderColor,
        borderWidth: 1
      }
    ]}>
      {selected ? (
        <LinearGradient
          colors={gradientColors} // Updated to match app theme (pink/red)
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
});
