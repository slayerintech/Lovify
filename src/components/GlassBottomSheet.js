import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const GlassBottomSheet = ({ visible, onClose, children }) => {
  const [contentHeight, setContentHeight] = useState(0);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const active = useSharedValue(false);
  const maxTranslateY = useSharedValue(0);

  // Update max translation when content height changes
  useEffect(() => {
    maxTranslateY.value = -contentHeight;
  }, [contentHeight]);

  const scrollTo = useCallback((destination, animated = true) => {
    'worklet';
    active.value = destination !== SCREEN_HEIGHT;
    if (animated) {
      translateY.value = withSpring(destination, { 
        damping: 50,
        stiffness: 300,
        mass: 1,
        overshootClamping: true
      });
    } else {
      translateY.value = destination;
    }
  }, []);

  useEffect(() => {
    if (visible && contentHeight > 0) {
      scrollTo(-contentHeight, false);
    } else if (!visible) {
      scrollTo(SCREEN_HEIGHT, true);
    }
  }, [visible, contentHeight, scrollTo]);

  const context = useSharedValue({ y: 0 });

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y;
      // Limit upward scrolling
      translateY.value = Math.max(translateY.value, maxTranslateY.value);
    })
    .onEnd((event) => {
      const sheetHeight = -maxTranslateY.value;
      const draggedDistance = translateY.value - maxTranslateY.value;
      
      // Dismiss if dragged down more than 25% of height or flicked down
      const shouldDismiss = draggedDistance > sheetHeight * 0.25 || event.velocityY > 500;

      if (shouldDismiss) {
        scrollTo(SCREEN_HEIGHT);
        runOnJS(onClose)();
      } else {
        scrollTo(maxTranslateY.value);
      }
    });

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const rBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        translateY.value,
        [SCREEN_HEIGHT, maxTranslateY.value],
        [0, 0.5],
        Extrapolation.CLAMP
      ),
      pointerEvents: visible ? 'auto' : 'none',
    };
  });

  const onLayout = (event) => {
      // Add padding for the drag handle area (approx 30px) + bottom safety
      const height = event.nativeEvent.layout.height;
      setContentHeight(height + 40);
  };

  if (!visible && translateY.value === SCREEN_HEIGHT) return null;

  return (
    <>
      <Animated.View style={[styles.backdrop, rBackdropStyle]} onTouchEnd={onClose} />
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.bottomSheetContainer, rBottomSheetStyle]}>
          <View style={styles.blurContainer}>
             <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
             <LinearGradient
                colors={['rgba(110, 51, 177, 0.1)', 'rgba(14, 3, 7, 0.4)']}
                style={StyleSheet.absoluteFill}
             />
             <View style={styles.line} />
             <View style={styles.contentContainer} onLayout={onLayout}>
               {children}
             </View>
             
             {/* Gradient Glow Borders */}
             <LinearGradient
               colors={['rgba(192, 180, 227, 0.3)', 'transparent']}
               style={styles.topBorder}
             />
          </View>
        </Animated.View>
      </GestureDetector>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    zIndex: 1000,
  },
  bottomSheetContainer: {
    height: SCREEN_HEIGHT,
    width: '100%',
    position: 'absolute',
    top: SCREEN_HEIGHT,
    zIndex: 1001,
  },
  blurContainer: {
    height: '100%',
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  line: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginVertical: 10,
    borderRadius: 2,
    zIndex: 2,
  },
  contentContainer: {
    // Removed flex: 1 to allow auto height measuring
    paddingBottom: 40, // Extra padding for safety
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 3,
  },
});
