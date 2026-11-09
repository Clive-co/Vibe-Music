import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  runOnJS,
  interpolate,
  useDerivedValue,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export const Equalizer = ({color = "#FA233B"}) => {
  const height1 = useSharedValue(5);
  const height2 = useSharedValue(5);
  const height3 = useSharedValue(5);

  function animateBar(sharedValue: Animated.SharedValue<number>) {
    'worklet';

    const nextHeight = Math.random() * 8 + 3;

    sharedValue.value = withTiming(nextHeight, {
      duration: 100 + Math.random() * 100,
      easing: Easing.inOut(Easing.ease),
    }, (finished) => {
      if (finished) {
        animateBar(sharedValue); // recurse natively!
      }
    });
  }

  useEffect(() => {
    animateBar(height1);
    animateBar(height2);
    animateBar(height3);

    return () => {
      cancelAnimation(height1);
      cancelAnimation(height2);
      cancelAnimation(height3);
    };
  }, []);

  const animatedProps1 = useAnimatedProps(() => ({
    height: height1.value,
    y: 10 - height1.value,
  }));

  const animatedProps2 = useAnimatedProps(() => ({
    height: height2.value,
    y: 10 - height2.value,
  }));

  const animatedProps3 = useAnimatedProps(() => ({
    height: height3.value,
    y: 10 - height3.value,
  }));

  return (
    <View>
      <Svg width="30" height="10">
        <AnimatedRect x="5" width="2" fill={color} animatedProps={animatedProps1} />
        <AnimatedRect x="10" width="2" fill={color} animatedProps={animatedProps2} />
        <AnimatedRect x="15" width="2" fill={color} animatedProps={animatedProps3} />
      </Svg>
    </View>
  );
}
