import React from 'react';
import { TextInput, StyleSheet, View, TouchableOpacity } from 'react-native';
import { COLORS } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

export const GlassInput = ({ containerStyle, style, error, rightIcon, onRightIconPress, ...props }) => {
  return (
    <View style={[
      styles.container, 
      error && styles.errorBorder,
      containerStyle
    ]}>
      <TextInput
        placeholderTextColor={COLORS.textSecondary}
        style={[styles.input, style]}
        {...props}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress} style={styles.iconContainer}>
          <Ionicons name={rightIcon} size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorBorder: {
    borderColor: '#FF3B30', // iOS System Red
    borderWidth: 1.5,
  },
  input: {
    padding: 16,
    color: COLORS.white,
    fontSize: 16,
    flex: 1,
  },
  iconContainer: {
    padding: 10,
    marginRight: 5,
  },
});
