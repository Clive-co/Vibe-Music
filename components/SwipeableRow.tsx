import { Octicons } from '@expo/vector-icons';
import React, { Component } from 'react';
import { Animated, StyleSheet, View, I18nManager } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';

type SwipeableRowProps = {
  children: React.ReactNode;
  onDelete: () => void;

};

export default class SwipeableRow extends Component<SwipeableRowProps> {
  private swipeableRow: Swipeable | null = null;

  private renderRightAction = (
    text: string,
    color: string,
    x: number,
    progress: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [x, 0],
    });
    const pressHandler = () => {
      this.close();
      if (text === 'Delete') {
        this.props.onDelete();
      }
    };

    return (
      <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
        <RectButton
          style={[styles.rightAction, { backgroundColor: color }]}
          onPress={pressHandler}
        >
          <Octicons
            name={
              text === 'Pin'
                ? 'pin'
                : text === 'Mute'
                ? 'bell-slash'
                : 'trash'
            }
            size={24}
            color="#fff"
          />
        </RectButton>
      </Animated.View>
    );
  };

  private renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragAnimatedValue: Animated.AnimatedInterpolation<number>
  ) => (
    <View
      style={{
        width: 192,
        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
      }}
    >
      {this.renderRightAction('Pin', '#E3DFE5', 192, progress)}
      {this.renderRightAction('Mute', '#756181', 128, progress)}
      {this.renderRightAction('Delete', '#74222f', 64, progress)}
    </View>
  );

  private updateRef = (ref: Swipeable | null) => {
    this.swipeableRow = ref;
  };

  private close = () => {
    if (this.swipeableRow) {
      this.swipeableRow.close();
    } 
  };

  render() {
    const { children } = this.props;
 
    return (
      <Swipeable
        ref={this.updateRef}
        friction={2}
        enableTrackpadTwoFingerGesture
        leftThreshold={30}
        rightThreshold={40}
        renderRightActions={this.renderRightActions}
      >
        {children}
      </Swipeable>
    );
  }
}

const styles = StyleSheet.create({
  rightAction: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});