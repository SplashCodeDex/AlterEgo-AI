/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Logo from '../components/Logo';

const SplashScreen = () => {
    return (
        <View style={styles.container}>
            <Logo size="large" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#18181B', // zinc-900
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SplashScreen;