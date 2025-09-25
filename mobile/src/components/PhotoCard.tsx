/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Download, RefreshCw, AlertTriangle, Share2, Heart } from 'lucide-react-native';
import AnimatedButton from './AnimatedButton';
import TextScramble from './TextScramble';

type ImageStatus = 'pending' | 'done' | 'error';

interface PhotoCardProps {
    imageUrl?: string;
    originalImageUrl?: string | null;
    caption: string;
    isSurprise?: boolean;
    status: ImageStatus;
    error?: string;
    onRegenerate?: () => void;
    onDownload?: () => void;
    onShare?: () => void;
    canRegenerate?: boolean;
    isFavorited?: boolean;
    onToggleFavorite?: (url: string, caption: string, originalUrl: string) => void;
}

const ShimmerLoader = () => (
    <View style={styles.centered}>
        <ActivityIndicator size="large" color="#A1A1AA" />
        <Text style={styles.loaderText}>Styling...</Text>
    </View>
);

const ErrorDisplay = ({ onRegenerate }: { onRegenerate?: () => void }) => (
    <View style={styles.centered}>
        <AlertTriangle size={48} stroke="#F87171" />
        <Text style={styles.errorTitle}>Generation Failed</Text>
        <Text style={styles.errorText}>The model couldn't create this image.</Text>
        {onRegenerate && (
            <AnimatedButton 
                onPress={onRegenerate} 
                style={styles.regenerateButton}
            >
                <RefreshCw size={14} stroke="#FCA5A5" /> 
                <Text style={styles.regenerateText}>Try Again</Text>
            </AnimatedButton>
        )}
    </View>
);

const PhotoCard: React.FC<PhotoCardProps> = ({ imageUrl, originalImageUrl, caption, isSurprise = false, status, onRegenerate, onDownload, onShare, canRegenerate = true, isFavorited = false, onToggleFavorite }) => {
    
    const handleFavoriteClick = () => {
        if (onToggleFavorite && imageUrl && originalImageUrl) {
            onToggleFavorite(imageUrl, caption, originalImageUrl);
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.imageContainer}>
                {status === 'pending' && <ShimmerLoader />}
                {status === 'error' && <ErrorDisplay onRegenerate={onRegenerate} canRegenerate={canRegenerate} />}
                {status === 'done' && imageUrl && (
                     <Image
                        key={imageUrl}
                        source={{ uri: imageUrl }}
                        style={styles.image}
                    />
                )}
            </View>
            <View style={styles.footer}>
                {isSurprise && status === 'done' ? <TextScramble text={caption} style={styles.caption} /> : <Text style={styles.caption} numberOfLines={1}>{caption}</Text>}
                
                {status === 'done' && imageUrl && (
                    <View style={styles.actions}>
                        <AnimatedButton onPress={handleFavoriteClick} style={styles.actionButton}>
                            <Heart size={18} stroke={isFavorited ? "#EF4444" : "#A1A1AA"} fill={isFavorited ? "#EF4444" : "none"} />
                        </AnimatedButton>
                        <AnimatedButton onPress={onRegenerate} style={styles.actionButton} disabled={!canRegenerate}>
                            <RefreshCw size={18} stroke={canRegenerate ? "#A1A1AA" : "#52525B"} />
                        </AnimatedButton>
                        <AnimatedButton onPress={onDownload} style={styles.actionButton}>
                            <Download size={18} stroke="#A1A1AA" />
                        </AnimatedButton>
                        <AnimatedButton onPress={onShare} style={styles.actionButton}>
                            <Share2 size={18} stroke="#A1A1AA" />
                        </AnimatedButton>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        width: '90%',
        maxWidth: 360,
        aspectRatio: 3 / 4.3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    imageContainer: {
        flex: 1,
        backgroundColor: '#27272A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    caption: {
        fontFamily: 'Inter-Bold',
        fontWeight: 'bold',
        fontSize: 18,
        color: '#E5E5E5',
        flex: 1,
        marginRight: 8,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionButton: {
        padding: 8,
        borderRadius: 9999,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    loaderText: {
        marginTop: 8,
        color: '#A1A1AA',
        fontSize: 16,
    },
    errorTitle: {
        fontFamily: 'Inter-Bold',
        fontWeight: 'bold',
        fontSize: 18,
        color: '#FCA5A5',
        marginTop: 8,
    },
    errorText: {
        color: '#A1A1AA',
        textAlign: 'center',
        marginBottom: 16,
    },
    regenerateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 9999,
    },
    regenerateText: {
        color: '#FCA5A5',
        fontSize: 14,
    },
    disabledButton: {
        opacity: 0.5,
    },
});

export default React.memo(PhotoCard);