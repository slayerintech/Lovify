import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../styles/theme';

export const GlassButton = ({ onPress, title, style, textStyle, disabled }) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        style,
        { opacity: pressed || disabled ? 0.7 : 1 }
      ]}
    >
      <BlurView intensity={80} tint="light" style={styles.blur}>
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </BlurView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  blur: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
