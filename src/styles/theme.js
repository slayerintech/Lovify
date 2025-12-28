import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#6e33b1', // Purple
  secondary: '#c0b4e3', // Soft Lavender
  tertiary: '#8e44ad', // Darker Purple
  background: '#13172A', // Deep Dark Blue
  card: 'rgba(255, 255, 255, 0.05)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(255, 255, 255, 0.15)',
  success: '#4CD964',
  error: '#FF3B30',
  white: '#FFFFFF',
  black: '#000000',
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  }
};

export const GRADIENTS = {
  primary: ['#6e33b1', '#8e44ad'],
  secondary: ['#c0b4e3', '#a569bd'],
  dark: ['#0e0307', '#1a0b14'],
  glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)'],
};

export const COMMON_STYLES = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  glassContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
