/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { Product, Subscription } from 'react-native-iap';
import { X, Crown, Infinity, Zap, Palette } from 'lucide-react-native';
import AnimatedButton from './AnimatedButton';

interface SubscriptionModalProps {
    onClose: () => void;
    subscriptions: Subscription[];
    products: Product[];
    onSubscribe: (sku: string) => void;
    onBuyCredits: (sku: string) => void;
}

const ProFeature = ({ children, icon }: { children: React.ReactNode, icon: React.ReactNode }) => (
    <View style={styles.proFeature}>
        {icon}
        <Text style={styles.proFeatureText}>{children}</Text>
    </View>
);

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, subscriptions, products, onSubscribe, onBuyCredits }) => {

    const proSubscription = subscriptions[0];
    // Fix: Changed `localizedPrice` to `price` to match the property on the Subscription object.
    const proPrice = (proSubscription as any)?.price;

    return (
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Get More Credits</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} stroke="#A1A1AA" />
                    </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.content}>
                    {/* Pro Section */}
                    <View style={styles.proSection}>
                        <View style={styles.proHeader}>
                            <Crown size={28} stroke="#FBBF24" />
                            <Text style={styles.proTitle}>AlterEgo AI PRO</Text>
                        </View>
                        <View style={styles.proFeaturesList}>
                            <ProFeature icon={<Infinity size={16} stroke="#34D399" />}>Unlimited Generations</ProFeature>
                            <ProFeature icon={<Zap size={16} stroke="#34D399" />}>No Watermarks</ProFeature>
                            <ProFeature icon={<Palette size={16} stroke="#34D399" />}>Access to All Styles</ProFeature>
                        </View>
                        {proSubscription && (
                             <AnimatedButton 
                                // Fix: Changed `productId` to `sku` to match the property on the Subscription object.
                                onPress={() => onSubscribe((proSubscription as any).sku)} 
                                style={styles.subscribeButton}
                             >
                                <Text style={styles.subscribeButtonText}>
                                    Subscribe Now {proPrice ? `(${proPrice}/month)` : ''}
                                </Text>
                            </AnimatedButton>
                        )}
                    </View>

                     {/* Credit Packs */}
                    <View style={styles.creditsSection}>
                        <Text style={styles.sectionTitle}>Or Buy Credit Packs</Text>
                        <View style={styles.creditPacksContainer}>
                            {products.map(product => (
                                <AnimatedButton 
                                    // Fix: Changed `productId` to `sku` to match the property on the Product object.
                                    key={(product as any).sku} 
                                    // Fix: Changed `productId` to `sku` to match the property on the Product object.
                                    onPress={() => onBuyCredits((product as any).sku)}
                                    style={styles.creditPackButton}
                                >
                                    <Text style={styles.creditPackTitle}>{product.title}</Text>
                                    {/* Fix: Changed `localizedPrice` to `price` to match the property on the Product object. */}
                                    <Text style={styles.creditPackPrice}>{(product as any).price}</Text>
                                </AnimatedButton>
                            ))}
                        </View>
                    </View>

                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#18181B',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: 'Sora-Bold',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 24,
    },
    proSection: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.5)',
        alignItems: 'center',
        marginBottom: 32,
    },
    proHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    proTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    proFeaturesList: {
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 24,
    },
    proFeature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    proFeatureText: {
        color: '#D4D4D4',
        fontSize: 16,
    },
    subscribeButton: {
        width: '100%',
        backgroundColor: '#2563EB',
        paddingVertical: 14,
        borderRadius: 8,
    },
    subscribeButtonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
    },
    creditsSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 16,
    },
    creditPacksContainer: {
        gap: 12,
    },
    creditPackButton: {
        backgroundColor: '#27272A',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3F3F46',
        alignItems: 'center',
    },
    creditPackTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    creditPackPrice: {
        color: '#A1A1AA',
        fontSize: 14,
        marginTop: 4,
    },
});

export default SubscriptionModal;
