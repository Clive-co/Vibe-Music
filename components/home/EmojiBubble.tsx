import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useActiveColors } from '@/constants/ThemeMode';


const EmojiBubble = (emoji: {emoji: string} ) => {
    const scale = useSharedValue(0);

    useEffect(() => {
      if (emoji) {
        scale.value = withTiming(1, { duration: 300 }); // Animate to full size
      }
    }, [emoji]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });

    const activeColors = useActiveColors()
    return (
      <Animated.View style={[styles.emojiBubble, animatedStyle, {backgroundColor: activeColors.background,}]}>
        <Text style={styles.emoji}>{emoji.emoji}</Text>
      </Animated.View>
    );
  };

export default EmojiBubble

const styles = StyleSheet.create({
    emojiBubble: {
        position: 'absolute',
        right: '5%',
        top: '5%',
        width: 35,
        height: 35,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
      },

      emoji:{
        //position: 'absolute', 
        //right: 10, 
        //top: 10, 
        fontSize: 20
      },
    
})