/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import { X } from 'lucide-react-native';
import type { GeneratedImage } from '../types';

interface GeneratingViewProps {
    uploadedImage: string;
    generatedImages: Record<string, GeneratedImage>;
    generatingIndex: number | null;
    styleCaptions: string[];
    onCancel: () => void;
}

const GeneratingView: React.FC<GeneratingViewProps> = ({ uploadedImage, generatedImages, generatingIndex, styleCaptions, onCancel }) => {
    const animatedValues = useMemo(() => styleCaptions.map(() => new Animated.Value(0)), [styleCaptions]);

    useEffect(() => {
        // Animate the cards based on the generating index
        animatedValues.forEach((val, index) => {
            let toValue = 0;
            if (generatingIndex !== null) {
                if (index < generatingIndex) toValue = -1; // Done
                else if (index === generatingIndex) toValue = 0; // Current
                else toValue = 1; // Pending
            } else {
                toValue = -1; // All done
            }
            
            Animated.spring(val, {
                toValue,
                useNativeDriver: true,
            }).start();
        });
    }, [generatingIndex, animatedValues]);

    const getStatusText = () => {
        if (generatingIndex === null) return "All Done!";
        const currentStyle = styleCaptions[generatingIndex];
        const currentImageInfo = generatedImages[currentStyle];
        const currentCaption = currentStyle === 'Surprise Me!' ? currentImageInfo?.caption : currentStyle;
        if (currentCaption) return `Styling ${currentCaption}... (${generatingIndex + 1}/${styleCaptions.length})`;
        return "Preparing to generate...";
    };

    return (
        <View style={styles.container}>
            <View style={styles.cardStack}>
                {styleCaptions.map((style, index) => {
                    const imageInfo = generatedImages[style];
                    const animatedValue = animatedValues[index];

                    const translateY = animatedValue.interpolate({
                        inputRange: [-1, 0, 1],
                        outputRange: [-500, 0, (index - (generatingIndex ?? 0)) * 12 + 12],
                    });
                    const scale = animatedValue.interpolate({
                        inputRange: [-1, 0, 1],
                        outputRange: [0.9, 1, 1 - (index - (generatingIndex ?? 0)) * 0.05],
                    });
                     const opacity = animatedValue.interpolate({
                        inputRange: [-1.5, -1, 0, 1],
                        outputRange: [0, 1, 1, 1],
                    });
                    
                    return (
                        <Animated.View
                            key={style}
                            style={[
                                styles.card,
                                {
                                    transform: [{ translateY }, { scale }],
                                    zIndex: styleCaptions.length - index,
                                    opacity,
                                },
                            ]}
                        >
                            <Image source={{ uri: imageInfo?.url || uploadedImage }} style={styles.image} />
                            {imageInfo?.status === 'pending' && <View style={styles.overlay} />}
                        </Animated.View>
                    );
                })}
            </View>

            <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                    {getStatusText()}
                </Text>
                <Text style={styles.subStatusText}>
                    {generatingIndex !== null ? "AI is creating..." : "Your results are ready."}
                </Text>
            </View>
            
            <View style={styles.cancelContainer}>
                {generatingIndex !== null && (
                    <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                        <X size={16} stroke="#D4D4D4" />
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    cardStack: {
        width: 288,
        height: 384,
        alignItems: 'center',
    },
    card: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: '#27272A',
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    statusContainer: {
        marginTop: 48,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#E5E5E5',
    },
    subStatusText: {
        fontSize: 14,
        color: '#A1A1AA',
        height: 20,
        marginTop: 4,
    },
    cancelContainer: {
        position: 'absolute',
        bottom: 24,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 9999,
    },
    cancelText: {
        fontSize: 14,
        color: '#D4D4D4',
    },
});

export default GeneratingView;