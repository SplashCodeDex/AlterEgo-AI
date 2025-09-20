/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Note: Gradients would require an external library like 'react-native-linear-gradient'.
// For simplicity, we'll use a solid color for the initial native migration.

interface LogoProps {
    size?: 'small' | 'large';
    style?: object;
    bgClass?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'small', style }) => {
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
                {/* FIX: Removed inline style object to fix typing error. Styles are now in StyleSheet.create */}
                <View style={baseStyles.innerCircle} />
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
        backgroundColor: '#60a5fa', // Blue-400 as a stand-in for gradient
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerCircle: {
        position: 'absolute',
        borderRadius: 9999,
        backgroundColor: '#18181B', // zinc-900
        // FIX: Moved from JS object to StyleSheet to fix DimensionValue type error
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