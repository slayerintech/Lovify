import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export const TinderCard = ({ user, onSwipeLeft, onSwipeRight }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd((event) => {
      if (Math.abs(event.velocityX) > 400 || Math.abs(event.translationX) > width * 0.25) {
        if (event.translationX > 0) {
          translateX.value = withSpring(width * 1.5);
          runOnJS(onSwipeRight)();
        } else {
          translateX.value = withSpring(-width * 1.5);
          runOnJS(onSwipeLeft)();
        }
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-width / 2, 0, width / 2],
      [-10, 0, 10],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, width / 4], [0, 1]),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-width / 4, 0], [1, 0]),
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Image source={{ uri: user.photos[0] }} style={styles.image} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.gradient}
        >
          <Text style={styles.name}>{user.name}, {user.age}</Text>
          <Text style={styles.bio} numberOfLines={2}>{user.bio}</Text>
        </LinearGradient>

        <Animated.View style={[styles.likeLabel, likeOpacity]}>
          <Text style={styles.likeText}>LIKE</Text>
        </Animated.View>

        <Animated.View style={[styles.nopeLabel, nopeOpacity]}>
          <Text style={styles.nopeText}>NOPE</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width * 0.9,
    height: height * 0.7,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: 'absolute',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    padding: 20,
    justifyContent: 'flex-end',
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  bio: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  likeLabel: {
    position: 'absolute',
    top: 50,
    left: 40,
    transform: [{ rotate: '-30deg' }],
    borderWidth: 4,
    borderColor: COLORS.success,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  likeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  nopeLabel: {
    position: 'absolute',
    top: 50,
    right: 40,
    transform: [{ rotate: '30deg' }],
    borderWidth: 4,
    borderColor: COLORS.error,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  nopeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.error,
  },
});
