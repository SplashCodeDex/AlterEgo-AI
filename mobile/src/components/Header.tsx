/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Coins, Crown, LayoutGrid, Star, History } from 'lucide-react-native';
import Logo from './Logo';

interface HeaderProps {
    credits: number;
    isPro: boolean;
    onGetCredits: () => void;
    onShowFavorites: () => void;
    onShowHistory: () => void;
}

const Header: React.FC<HeaderProps> = ({ credits, isPro, onGetCredits, onShowFavorites, onShowHistory }) => {
    return (
        <View style={styles.header}>
            <View style={styles.container}>
                <Logo size="small" />
                <View style={styles.actions}>
                    {isPro ? (
                        <View style={styles.proBadge}>
                            {/* FIX: Changed color prop to stroke to fix type error */}
                            <Crown size={16} stroke="#FBBF24" />
                            <Text style={styles.proText}>PRO</Text>
                        </View>
                    ) : (
                         <TouchableOpacity onPress={onGetCredits} style={styles.creditsButton}>
                            {/* FIX: Changed color prop to stroke to fix type error */}
                            <Coins size={20} stroke="#F59E0B" />
                            <Text style={styles.creditsText}>{credits}</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={onShowHistory} style={styles.iconButton} >
                        {/* FIX: Changed color prop to stroke to fix type error */}
                        <History size={20} stroke="#D4D4D4" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onShowFavorites} style={styles.iconButton} >
                        {/* FIX: Changed color prop to stroke to fix type error */}
                        <Star size={20} stroke="#D4D4D4" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        {/* FIX: Changed color prop to stroke to fix type error */}
                        <LayoutGrid size={20} stroke="#D4D4D4" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        paddingVertical: 12,
        zIndex: 50,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.3)',
        borderRadius: 9999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    proText: {
        color: '#FBBF24',
        fontWeight: 'bold',
        fontSize: 14,
    },
    creditsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 9999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    creditsText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    iconButton: {
        padding: 10,
        borderRadius: 9999,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
});

export default React.memo(Header);