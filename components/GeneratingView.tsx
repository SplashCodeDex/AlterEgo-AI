/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Camera, X } from 'lucide-react';

type ImageStatus = 'pending' | 'done' | 'error';
interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    caption: string;
}

interface GeneratingViewProps {
    uploadedImage: string;
    generatedImages: Record<string, GeneratedImage>;
    generatingIndex: number | null;
    styles: string[];
    onCancel: () => void;
}


const GradientGlow = () => (
    <div className="absolute -inset-2 rounded-3xl pointer-events-none opacity-70">
        <div
            className="absolute inset-0 rounded-3xl"
            style={{
                background: 'conic-gradient(from 180deg at 50% 50%, #a855f7, #3b82f6, #ec4899, #a855f7)',
                filter: 'blur(20px)',
                animation: 'rotate 5s linear infinite',
            }}
        />
    </div>
);

const Glitter = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        {Array.from({ length: 20 }).map((_, i) => {
            const size = Math.random() * 3 + 1;
            const delay = Math.random() * 5;
            const duration = Math.random() * 2 + 3;
            return (
                <span
                    key={i}
                    className="absolute bg-white rounded-full"
                    style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animation: `sparkle ${duration}s linear ${delay}s infinite`,
                    }}
                />
            );
        })}
    </div>
);


const GeneratingView: React.FC<GeneratingViewProps> = ({ uploadedImage, generatedImages, generatingIndex, styles, onCancel }) => {
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    
    const getStatusText = () => {
        if (generatingIndex === null) return "All Done!";
        const currentStyle = styles[generatingIndex];
        const currentImageInfo = generatedImages[currentStyle];
        const currentCaption = currentStyle === 'Surprise Me!' ? currentImageInfo?.caption : currentStyle;
        if (currentCaption) return `Styling ${currentCaption}... (${generatingIndex + 1}/${styles.length})`;
        return "Preparing to generate...";
    };

    const handleCancelClick = () => {
        setShowCancelConfirm(true);
    };

    const handleConfirmCancel = () => {
        onCancel();
        setShowCancelConfirm(false);
    };

    const gIndex = generatingIndex ?? styles.length;

    // Create a new array that represents the visual stacking order:
    // 1. The currently generating card
    // 2. All pending cards
    // 3. All completed cards (in reverse order of completion)
    const generatingStyle = styles.length > gIndex ? [styles[gIndex]] : [];
    const pendingStyles = styles.slice(gIndex + 1);
    const doneStyles = styles.slice(0, gIndex).reverse();
    
    const orderedStyles = [...generatingStyle, ...pendingStyles, ...doneStyles];

    return (
        <motion.div
            key="generating-stack"
            {...{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
            }}
            className="w-full h-full flex flex-col items-center justify-center relative"
        >
            <div 
                className="w-64 h-80 sm:w-72 sm:h-96 relative"
                style={{
                    animation: 'pan 15s ease-in-out infinite'
                }}
            >
                <AnimatePresence>
                    {orderedStyles.map((style, visualIndex) => {
                        const imageInfo = generatedImages[style];
                        const isGenerating = visualIndex === 0 && generatingStyle.length > 0;
                        const originalIndex = styles.indexOf(style);
                        
                        return (
                            <motion.div
                                key={style}
                                {...{
                                    layout: true,
                                    initial: { y: 30, scale: 0.9, rotate: 0, opacity: 0 },
                                    animate: {
                                        y: isGenerating ? 0 : visualIndex * 12,
                                        scale: isGenerating ? 1 : 1 - visualIndex * 0.05,
                                        rotate: isGenerating ? 0 : (originalIndex % 2 === 0 ? 1 : -1) * visualIndex,
                                        zIndex: orderedStyles.length - visualIndex,
                                        opacity: 1
                                    },
                                    exit: { y: 50, opacity: 0, scale: 0.8, transition: { duration: 0.3 } },
                                    transition: { type: 'spring', stiffness: 200, damping: 25 },
                                }}
                                className="absolute w-full h-full bg-neutral-800 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex items-center justify-center"
                                style={{
                                    animation: isGenerating ? 'levitate 6s ease-in-out infinite' : 'none',
                                }}
                            >
                                {isGenerating && !imageInfo?.url && <GradientGlow />}
                                
                                {imageInfo?.url ? (
                                    <img src={imageInfo.url} alt={imageInfo.caption} className="w-full h-full object-cover"/>
                                ) : isGenerating ? (
                                    <>
                                        <img src={uploadedImage} alt="Your photo" className="w-full h-full object-cover"/>
                                        <Glitter />
                                    </>
                                ) : (
                                     <div className="text-neutral-600 flex flex-col items-center opacity-50 mix-blend-soft-light">
                                        <Camera size={64} strokeWidth={1}/>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={generatingIndex ?? "done"}
                    {...{
                        initial: { opacity: 0, y: 10 },
                        animate: { opacity: 1, y: 0 },
                        exit: { opacity: 0, y: -10 },
                        transition: { duration: 0.3 },
                    }}
                    className="mt-12 text-center"
                >
                    <p className={cn("text-lg font-bold", generatingIndex === null ? "text-green-400" : "text-neutral-200")}>
                        {getStatusText()}
                    </p>
                    <p className="text-neutral-400 text-sm h-5">
                        {generatingIndex !== null ? "AI is creating..." : "Your results are ready."}
                    </p>
                </motion.div>
            </AnimatePresence>
            
            <div className="absolute bottom-6 sm:bottom-12">
                <AnimatePresence>
                    {generatingIndex !== null && !showCancelConfirm && (
                        <motion.button
                            {...{
                                initial: { opacity: 0, y: 10 },
                                animate: { opacity: 1, y: 0 },
                                exit: { opacity: 0, y: 10 },
                            }}
                            onClick={handleCancelClick}
                            className="flex items-center gap-2 text-sm text-neutral-400 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 hover:text-white transition-colors"
                        >
                            <X size={16} /> Cancel
                        </motion.button>
                    )}
                    {showCancelConfirm && (
                        <motion.div
                             {...{
                                initial: { opacity: 0, scale: 0.9 },
                                animate: { opacity: 1, scale: 1 },
                                exit: { opacity: 0, scale: 0.9 },
                             }}
                            className="flex items-center gap-2 bg-black/50 backdrop-blur-sm p-2 rounded-full"
                        >
                            <span className="text-sm font-semibold text-neutral-300 pl-2">Stop generation?</span>
                            <button onClick={handleConfirmCancel} className="text-sm font-bold bg-red-600 text-white rounded-full px-3 py-1 hover:bg-red-500">
                                Yes
                            </button>
                             <button onClick={() => setShowCancelConfirm(false)} className="text-sm font-bold bg-white/10 text-white rounded-full px-3 py-1 hover:bg-white/20">
                                No
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default GeneratingView;