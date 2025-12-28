import React from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import { COLORS } from '../styles/theme';

export const GlassInput = ({ containerStyle, style, ...props }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        placeholderTextColor={COLORS.textSecondary}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  input: {
    padding: 16,
    color: COLORS.white,
    fontSize: 16,
  },
});
