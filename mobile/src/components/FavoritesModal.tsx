/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { X, Heart, Download, Share2 } from 'lucide-react-native';
import type { FavoritedImage } from '../types';

interface FavoritesModalProps {
    images: FavoritedImage[];
    onClose: () => void;
    onToggleFavorite: (url: string, caption: string, originalUrl: string) => void;
    onDownload: (url: string, caption: string) => void;
    onShare: (url: string, caption: string) => void;
    onShareComparison: (originalUrl: string, generatedUrl: string, caption: string) => void;
}


const FavoriteItem: React.FC<{ image: FavoritedImage; onToggleFavorite: () => void; }> = ({ image, onToggleFavorite }) => {
    return (
        <View style={styles.favItemContainer}>
            <Image source={{ uri: image.url }} style={styles.favItemImage} />
            <View style={styles.favItemOverlay}>
                <Text style={styles.favItemCaption} numberOfLines={1}>{image.caption}</Text>
                <TouchableOpacity onPress={onToggleFavorite} style={styles.favItemButton}>
                    <Heart size={16} fill="#EF4444" stroke="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );
};


const FavoritesModal: React.FC<FavoritesModalProps> = ({ images, onClose, onToggleFavorite, onDownload, onShare, onShareComparison }) => {
    return (
         <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Your Favorites</Text>
                     <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} stroke="#A1A1AA" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {images.length > 0 ? (
                        <FlatList
                            data={images}
                            keyExtractor={(item) => item.url}
                            numColumns={3}
                            renderItem={({ item }) => (
                                <FavoriteItem 
                                    image={item}
                                    onToggleFavorite={() => onToggleFavorite(item.url, item.caption, item.originalUrl)}
                                />
                            )}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Heart size={48} stroke="#71717A" />
                            <Text style={styles.emptyStateTitle}>No Favorites Yet</Text>
                            <Text style={styles.emptyStateText}>Tap the heart icon on any generated image to save it here.</Text>
                        </View>
                    )}
                </View>
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
        padding: 8,
    },
    favItemContainer: {
        flex: 1 / 3,
        aspectRatio: 1,
        padding: 4,
    },
    favItemImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    favItemOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 8,
        padding: 8,
        justifyContent: 'space-between',
    },
    favItemCaption: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    favItemButton: {
        alignSelf: 'flex-end',
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 99,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#E5E5E5',
        marginTop: 16,
    },
    emptyStateText: {
        color: '#A1A1AA',
        textAlign: 'center',
        marginTop: 8,
        maxWidth: 250,
    },
});

export default FavoritesModal;
