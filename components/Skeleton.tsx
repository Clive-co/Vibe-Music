import React from 'react';
import { View, useColorScheme, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type Length = number | 'auto' | `${number}%`;

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  lightColors?: [string, string, string];
  darkColors?: [string, string, string];
  style?: any;
};

export default function Skeleton({
  width = 100,
  height = 20,
  borderRadius = 4,
  lightColors = ['#e0e0e0', '#f5f5f5', '#e0e0e0'],
  darkColors = ['#303030', '#505050', '#303030'],
  style,
}: SkeletonProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;

  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 800 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors[0],
          overflow: 'hidden',
        },
        animatedStyle,
        style,
      ]}
    >
      <LinearGradient
        colors={colors}
        start={[0, 0.5]}
        end={[1, 0.5]}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}