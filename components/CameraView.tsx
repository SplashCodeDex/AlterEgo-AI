/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Camera as CameraIcon, RefreshCw, AlertTriangle } from 'lucide-react';

interface CameraViewProps {
    onCapture: (imageDataUrl: string) => void;
    onClose: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [error, setError] = useState<string | null>(null);
    const [isCameraInitializing, setIsCameraInitializing] = useState(true);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        stopStream(); // Stop any existing stream
        setError(null);
        setIsCameraInitializing(true);
        
        const constraints = {
            video: { 
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setIsCameraInitializing(false);
            })
            .catch(err => {
                console.error("Error accessing camera:", err);
                if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                    setError("Camera permission denied. Please enable it in your browser settings.");
                } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                    setError("No camera found. Please ensure a camera is connected and enabled.");
                } else {
                    setError("Could not access the camera. Please try again.");
                }
                setIsCameraInitializing(false);
            });

        return () => {
            stopStream();
        };
    }, [facingMode, stopStream]);

    const handleFlipCamera = () => {
        setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Match canvas to video's intrinsic dimensions for high quality
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Flip the image horizontally if it's the front-facing camera
            if (facingMode === 'user') {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            onCapture(dataUrl);
        }
    };

    return (
        <motion.div
            {...{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
            }}
            className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center"
        >
            <div className="absolute top-4 left-4 z-20">
                <button onClick={onClose} className="p-3 bg-black/40 rounded-full text-white hover:bg-black/70 transition-colors">
                    <X size={24} />
                </button>
            </div>
            <div className="relative w-full h-full flex items-center justify-center">
                {isCameraInitializing && <div className="text-white">Starting Camera...</div>}
                {error && (
                     <div className="flex flex-col items-center justify-center text-center text-red-400 p-8">
                        <AlertTriangle size={48} className="mb-2" />
                        <p className="font-semibold text-lg">Camera Error</p>
                        <p className="text-sm text-neutral-400">{error}</p>
                    </div>
                )}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraInitializing || error ? 'opacity-0' : 'opacity-100'} ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
                />
                <canvas ref={canvasRef} className="hidden" />
            </div>
            
            {!error && !isCameraInitializing && (
                <div className="absolute bottom-8 left-0 right-0 z-20 flex items-center justify-center gap-16">
                    <button 
                        onClick={handleFlipCamera} 
                        className="p-4 bg-black/40 rounded-full text-white hover:bg-black/70 transition-colors"
                        aria-label="Flip Camera"
                    >
                        <RefreshCw size={28} />
                    </button>
                    <button 
                        onClick={handleCapture} 
                        className="w-20 h-20 rounded-full bg-white ring-4 ring-offset-4 ring-offset-black ring-white/50 transition-transform hover:scale-105"
                        aria-label="Take Photo"
                    />
                    <div className="w-16 h-16"></div> {/* Spacer */}
                </div>
            )}
        </motion.div>
    );
};

export default CameraView;