import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ScrollView } from 'react-native';
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
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export const TinderCard = React.memo(forwardRef(({ user, onSwipeLeft, onSwipeRight }, ref) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Optimization: Simple spring config
  const SPRING_CONFIG = {
    damping: 15,
    stiffness: 120,
    mass: 0.5,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  };

  useImperativeHandle(ref, () => ({
    swipeLeft: () => {
      translateX.value = withSpring(-width * 1.5, SPRING_CONFIG, () => {
        runOnJS(onSwipeLeft)();
      });
    },
    swipeRight: () => {
      translateX.value = withSpring(width * 1.5, SPRING_CONFIG, () => {
        runOnJS(onSwipeRight)();
      });
    },
  }));

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Only activate on horizontal movement
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
          translateX.value = withSpring(width * 1.5, SPRING_CONFIG, () => {
            runOnJS(onSwipeRight)();
          });
        } else {
          translateX.value = withSpring(-width * 1.5, SPRING_CONFIG, () => {
            runOnJS(onSwipeLeft)();
          });
        }
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    // Simplify interpolation for smoother frame rates
    const rotate = interpolate(
      translateX.value,
      [-width, 0, width],
      [-15, 0, 15],
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
        {/* Full Screen Image */}
        <Image 
          source={typeof user.photos[0] === 'number' ? user.photos[0] : { uri: user.photos[0] }} 
          style={styles.image} 
          fadeDuration={0} // Disable fade animation for snappier loading
        />
        
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />

        <View style={styles.cardInfo}>
          <Text style={styles.name}>{user.name}, {user.age}</Text>
        </View>

        <Animated.View style={[styles.likeLabel, likeOpacity]}>
          <Text style={styles.likeText}>LIKE</Text>
        </Animated.View>

        <Animated.View style={[styles.nopeLabel, nopeOpacity]}>
          <Text style={styles.nopeText}>NOPE</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}))

const styles = StyleSheet.create({
  card: {
    width: width * 0.9,
    height: height * 0.7,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: 'absolute',
    alignSelf: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    zIndex: 1,
    pointerEvents: 'none',
  },
  cardInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 2,
  },
  name: {
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
    zIndex: 100,
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
    zIndex: 100,
  },
  nopeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.error,
  },
});

