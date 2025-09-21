/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useCallback } from 'react';
import { View, ImageBackground, Text, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';

// Job interface to manage pending watermark requests
interface WatermarkJob {
    imageUrl: string;
    resolve: (uri: string) => void;
    reject: (e: Error) => void;
}

const watermarkStyles = StyleSheet.create({
    watermarkContainer: {
        // Render at a fixed high resolution to ensure watermark quality.
        width: 1024,
        height: 1024,
    },
    watermarkText: {
        position: 'absolute',
        right: 15,
        bottom: 15,
        fontFamily: 'Sora-Bold',
        fontWeight: 'bold',
        fontSize: 24, // Scaled for a 1024px image
        color: 'rgba(255, 255, 255, 0.5)',
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
    },
    hiddenView: {
        position: 'absolute',
        top: -10000, // Position the component far off-screen
        left: 0,
    }
});

/**
 * A hook to process images by adding a watermark.
 * It uses an off-screen ViewShot component to render the image with a watermark and capture it.
 * @returns An object with the processing function and the component to be rendered.
 */
export const useImageProcessor = () => {
    const [job, setJob] = useState<WatermarkJob | null>(null);
    const imageCaptureRef = useRef<ViewShot>(null);

    // Callback triggered when the off-screen image has loaded.
    const onImageLoad = useCallback(async () => {
        if (!job || !imageCaptureRef.current?.capture) {
            console.warn("onImageLoad called without a job or ref.");
            job?.reject(new Error("Watermark processing failed: Component not ready."));
            setJob(null);
            return;
        }
        try {
            // A small delay to ensure the text watermark has rendered fully.
            await new Promise(res => setTimeout(res, 50));
            const uri = await imageCaptureRef.current.capture();
            job.resolve(uri);
        } catch (e) {
            console.error("Failed to capture watermarked image:", e);
            job.reject(e instanceof Error ? e : new Error("Image capture failed during watermarking."));
        } finally {
            setJob(null); // Reset after completion
        }
    }, [job]);

    // Function to be called from the app to request watermarking.
    const processImageWithWatermark = useCallback((imageUrl: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            // Setting the job will trigger a re-render and show the ImageProcessorComponent
            setJob({ imageUrl, resolve, reject });
        });
    }, []);
    
    // The component to be rendered at a high level in the app tree.
    // It remains hidden off-screen and does not interact with user input.
    // FIX: Corrected JSX structure and ref name. The original parsing errors were due to the redeclared ref variable.
    const ImageProcessorComponent = (
        job ? (
            <View style={watermarkStyles.hiddenView} pointerEvents="none">
                 <ViewShot ref={imageCaptureRef} options={{ format: 'png', quality: 0.95 }}>
                    <ImageBackground 
                        source={{ uri: job.imageUrl }} 
                        style={watermarkStyles.watermarkContainer}
                        onLoad={onImageLoad}
                        onError={(e) => job.reject(new Error(e.nativeEvent.error))}
                    >
                        <Text style={watermarkStyles.watermarkText}>AlterEgo AI</Text>
                    </ImageBackground>
                </ViewShot>
            </View>
        ) : null
    );

    return { processImageWithWatermark, ImageProcessorComponent };
}
