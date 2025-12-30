import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  withRepeat,
  cancelAnimation,
  runOnJS,
  interpolate,
  Extrapolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export const TinderCard = React.memo(forwardRef(({ user, active, onSwipeLeft, onSwipeRight }, ref) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const isInteracting = useSharedValue(false);

  // Optimization: Simple spring config
  const SPRING_CONFIG = {
    damping: 15,
    stiffness: 120,
    mass: 0.5,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  };

  // Idle Animation Loop
  useEffect(() => {
    if (active) {
      // Wait 3s, then nudge left, back, right, back. Repeat forever.
      const nudge = 30;
      const duration = 400;
      const easing = Easing.inOut(Easing.quad);

      translateX.value = withRepeat(
        withSequence(
          withDelay(3000, withTiming(-nudge, { duration, easing })),
          withTiming(0, { duration, easing }),
          withTiming(nudge, { duration, easing }),
          withTiming(0, { duration, easing })
        ),
        -1 // Infinite repeat
      );
    } else {
      cancelAnimation(translateX);
      translateX.value = 0;
    }
  }, [active]);

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
      cancelAnimation(translateX);
      isInteracting.value = true;
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd((event) => {
      isInteracting.value = false;
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
        
        // Note: The useEffect dependency on [active] doesn't re-run here,
        // so the idle animation won't automatically restart until re-render.
        // But since 'active' is likely still true, we can manually restart it?
        // Actually, let's keep it simple. If user lets go without swiping,
        // we might want the idle animation to kick back in after 3s.
        // We can achieve this by using a key or triggering a re-render in parent,
        // but typically user will swipe eventually.
        // For now, if user touches and releases, the card stays still until next mount/update.
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

    // Dynamic Border Color
    // Left swipe (negative X) -> Red
    // Right swipe (positive X) -> Green
    // We interpolate a color value based on translateX
    // But Animated Styles don't support direct color interpolation easily without interpolateColor (which needs to be imported)
    // Alternatively, we can use opacity of an overlay border.
    
    // Let's use interpolateColor if available, or just toggle classes? 
    // Reanimated 2+ supports interpolateColor.
    
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  // Separate style for the border to keep the transform simple
  const borderStyle = useAnimatedStyle(() => {
    // Threshold for full color
    const threshold = width * 0.25;
    
    // Calculate intensity based on swipe distance
    // 0 -> 0 (transparent)
    // threshold -> 1 (full color)
    const intensity = interpolate(
      Math.abs(translateX.value),
      [0, threshold],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    // Determine color based on direction
    const isRight = translateX.value > 0;
    
    // Default border color when intensity is near 0
    const defaultBorderColor = 'rgba(255, 255, 255, 0.15)'; // Match THEME.glassBorder
    
    if (intensity < 0.05) {
        return {
            borderColor: defaultBorderColor,
            borderWidth: 1, // Default border width
        };
    }

    const borderColor = isRight ? 'rgba(50, 215, 75, ' : 'rgba(255, 69, 58, '; // Green or Red
    
    return {
      borderColor: `${borderColor}${intensity})`,
      borderWidth: interpolate(Math.abs(translateX.value), [0, 50], [1, 4], Extrapolate.CLAMP),
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
      <Animated.View style={[styles.card, animatedStyle, borderStyle]}>
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

