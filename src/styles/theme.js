import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#FF4B8B', // Pink
  secondary: '#8B4BFF', // Purple
  tertiary: '#4B8BFF', // Blue
  background: '#0F0F1E', // Dark background
  card: 'rgba(255, 255, 255, 0.1)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(255, 255, 255, 0.2)',
  success: '#4CD964',
  error: '#FF3B30',
  white: '#FFFFFF',
  black: '#000000',
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  }
};

export const GRADIENTS = {
  primary: ['#FF4B8B', '#8B4BFF'],
  secondary: ['#8B4BFF', '#4B8BFF'],
  dark: ['#1A1A2E', '#16213E'],
  glass: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)'],
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
