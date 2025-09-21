/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface LogoProps {
    size?: 'small' | 'large';
    style?: object;
    innerCircleBgColor?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'small', style, innerCircleBgColor }) => {
    const sizeStyles = {
        small: {
            container: { height: 32, gap: 10 },
            logoMark: { width: 32, height: 32 },
            text: { fontSize: 20 },
            dot: { width: 8, height: 8 },
        },
        large: {
            container: { height: 80, gap: 16 },
            logoMark: { width: 80, height: 80 },
            text: { fontSize: 48 },
            dot: { width: 20, height: 20 },
        }
    };
    
    const styles = sizeStyles[size];

    return (
        <View style={[baseStyles.container, styles.container, style]}>
            <View style={[baseStyles.logoMark, styles.logoMark]}>
                <LinearGradient
                    colors={['#3B82F6', '#8B5CF6']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                <View style={[baseStyles.innerCircle, innerCircleBgColor ? { backgroundColor: innerCircleBgColor } : {}]} />
                <View style={[baseStyles.dot, styles.dot]} />
            </View>
            <Text style={[baseStyles.text, styles.text]}>
                AlterEgo AI
            </Text>
        </View>
    );
};

const baseStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoMark: {
        position: 'relative',
        borderRadius: 9999,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Required for LinearGradient border-radius to work
    },
    innerCircle: {
        position: 'absolute',
        borderRadius: 9999,
        backgroundColor: '#18181B', // zinc-900
        top: '15%',
        left: '15%',
        right: '15%',
        bottom: '15%',
    },
    dot: {
        backgroundColor: 'white',
        borderRadius: 9999,
    },
    text: {
        fontFamily: 'Sora-Bold', // Assuming you've linked this font natively
        fontWeight: 'bold',
        color: '#E5E5E5', // neutral-100
        letterSpacing: -1,
    }
});

export default Logo;