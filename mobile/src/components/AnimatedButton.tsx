/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef } from 'react';
import { TouchableOpacity, Animated, TouchableOpacityProps } from 'react-native';

interface AnimatedButtonProps extends TouchableOpacityProps {
    // FIX: Removed redundant `children` property. `TouchableOpacityProps` already defines it,
    // and redefining it was causing type inference issues for other props like `style` and `onPress`.
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ children, style, ...props }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(scaleValue, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            {...props}
        >
            <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};

export default AnimatedButton;
