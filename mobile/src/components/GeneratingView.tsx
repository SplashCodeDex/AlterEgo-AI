/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { X, Camera } from 'lucide-react-native';
import type { GeneratedImage } from '../types';

interface GeneratingViewProps {
    uploadedImage: string;
    generatedImages: Record<string, GeneratedImage>;
    generatingIndex: number | null;
    styles: string[];
    onCancel: () => void;
}

const GeneratingView: React.FC<GeneratingViewProps> = ({ uploadedImage, generatedImages, generatingIndex, styles, onCancel }) => {
    
    const getStatusText = () => {
        if (generatingIndex === null) return "All Done!";
        const currentStyle = styles[generatingIndex];
        const currentImageInfo = generatedImages[currentStyle];
        const currentCaption = currentStyle === 'Surprise Me!' ? currentImageInfo?.caption : currentStyle;
        if (currentCaption) return `Styling ${currentCaption}... (${generatingIndex + 1}/${styles.length})`;
        return "Preparing to generate...";
    };

    const gIndex = generatingIndex ?? styles.length;

    // Simplified stack for native: Show only the top card with the original image.
    // The web's complex multi-card animation is less performant in React Native without a dedicated animation library.
    const currentStyle = styles.length > gIndex ? styles[gIndex] : null;

    return (
        // FIX: Renamed `styles` to `sheetStyles` to avoid a naming collision with the `styles` prop.
        <View style={sheetStyles.container}>
            <View style={sheetStyles.cardStack}>
                <View style={sheetStyles.card}>
                    <Image source={{ uri: uploadedImage }} style={sheetStyles.image} />
                    {generatingIndex !== null && (
                         <View style={sheetStyles.overlay}>
                            <ActivityIndicator size="large" color="white" />
                        </View>
                    )}
                </View>
            </View>

            <View style={sheetStyles.statusContainer}>
                <Text style={sheetStyles.statusText}>
                    {getStatusText()}
                </Text>
                <Text style={sheetStyles.subStatusText}>
                    {generatingIndex !== null ? "AI is creating..." : "Your results are ready."}
                </Text>
            </View>
            
            <View style={sheetStyles.cancelContainer}>
                {generatingIndex !== null && (
                    <TouchableOpacity onPress={onCancel} style={sheetStyles.cancelButton}>
                        <X size={16} stroke="#D4D4D4" />
                        <Text style={sheetStyles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// FIX: Renamed `styles` to `sheetStyles` to avoid a naming collision with the `styles` prop.
const sheetStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    cardStack: {
        width: 288,
        height: 384,
        position: 'relative',
    },
    card: {
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
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusContainer: {
        marginTop: 48,
        textAlign: 'center',
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
