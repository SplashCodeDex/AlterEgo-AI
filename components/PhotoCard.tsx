/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '../lib/utils';
import { Download, RefreshCw, AlertTriangle, Image as ImageIcon, Share2, Heart, GitCompareArrows } from 'lucide-react';

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
    onShareComparison?: (originalUrl: string, generatedUrl: string, caption: string) => void;
    canRegenerate?: boolean;
    isFavorited?: boolean;
    onToggleFavorite?: (url: string, caption: string, originalUrl: string) => void;
}

const ShimmerLoader = () => (
    <div className="absolute inset-0 overflow-hidden">
        <div className="animate-[shimmer_2s_infinite] absolute inset-0 -translate-x-full bg-gradient-to-r from-neutral-800 via-neutral-700/80 to-neutral-800"></div>
    </div>
);

const ErrorDisplay = ({ onRegenerate, canRegenerate }: { onRegenerate?: () => void, canRegenerate?: boolean }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-red-400 p-4">
        <AlertTriangle size={48} className="mb-2" />
        <p className="font-semibold text-lg">Generation Failed</p>
        <p className="text-sm text-neutral-400 mb-4">The model couldn't create this image.</p>
        {onRegenerate && (
            <button 
                onClick={onRegenerate} 
                disabled={!canRegenerate}
                className="flex items-center gap-2 text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-full hover:bg-red-500/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={canRegenerate ? 'Try Again (1 Credit)' : 'Not enough credits'}
            >
                <RefreshCw size={14} /> Try Again
            </button>
        )}
    </div>
);

const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-neutral-600">
        <ImageIcon size={64} strokeWidth={1} />
    </div>
);


const TextScramble = ({ text }: { text: string }) => {
    const [displayText, setDisplayText] = useState('');
    const isMounted = useRef(true);
    
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        const scramble = async () => {
            const chars = '!<>-_\\/[]{}—=+*^?#________';
            let tempText = text.split('').map(() => '').join('');
            setDisplayText(tempText);
            await new Promise(res => setTimeout(res, 100));

            for (let i = 0; i < text.length; i++) {
                let cycles = 2; 
                for (let j = 0; j < cycles; j++) {
                    let newText = text.substring(0, i);
                    for (let k = i; k < text.length; k++) {
                        newText += chars[Math.floor(Math.random() * chars.length)];
                    }
                     if (!isMounted.current) return;
                    setDisplayText(newText);
                    await new Promise(res => setTimeout(res, 50));
                }
                 if (!isMounted.current) return;
                setDisplayText(text.substring(0, i + 1) + displayText.substring(i + 1));
            }
        };
        scramble();
    }, [text]);

    return <span className="font-bold text-base sm:text-lg text-neutral-200 truncate flex-1 mr-2">{displayText}</span>;
};


const PhotoCard: React.FC<PhotoCardProps> = ({ imageUrl, originalImageUrl, caption, isSurprise = false, status, error, onRegenerate, onDownload, onShare, onShareComparison, canRegenerate = true, isFavorited = false, onToggleFavorite }) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const heartControls = useAnimation();
    
    useEffect(() => {
        setIsImageLoaded(false);
    }, [imageUrl]);

    const handleFavoriteClick = () => {
        if (onToggleFavorite && imageUrl && originalImageUrl) {
            onToggleFavorite(imageUrl, caption, originalImageUrl);
            // Trigger the "pop" animation
            heartControls.start({
                scale: [1, 1.3, 1],
                transition: { duration: 0.3 }
            });
        }
    };

    const handleShareComparisonClick = () => {
        if (onShareComparison && originalImageUrl && imageUrl) {
            onShareComparison(originalImageUrl, imageUrl, caption);
        }
    }


    const actionButtonClasses = "p-2 rounded-full text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent";

    return (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl w-[90vw] max-w-[320px] sm:w-80 md:w-96 shadow-2xl shadow-black/30 overflow-hidden flex flex-col aspect-[3/4.3]">
            <div className="w-full bg-neutral-800 flex-grow relative overflow-hidden">
                {status === 'pending' && <ShimmerLoader />}
                {status === 'error' && <ErrorDisplay onRegenerate={onRegenerate} canRegenerate={canRegenerate} />}
                {status === 'done' && !imageUrl && <Placeholder />}
                {status === 'done' && imageUrl && (
                     <img
                        key={imageUrl}
                        src={imageUrl}
                        alt={caption}
                        onLoad={() => setIsImageLoaded(true)}
                        className={cn(
                            "w-full h-full object-cover transition-opacity duration-500",
                            isImageLoaded ? 'opacity-100' : 'opacity-0'
                        )}
                    />
                )}
            </div>
            <div className="flex items-center justify-between p-4 border-t border-white/10">
                {isSurprise && status === 'done' ? <TextScramble text={caption} /> : <p className="font-bold text-base sm:text-lg text-neutral-200 truncate flex-1 mr-2">{caption}</p>}
                
                {status === 'done' && imageUrl && (
                    <div className="flex items-center gap-1">
                        {onToggleFavorite && (
                             <motion.button
                                {...{whileTap:{ scale: 0.8 }}}
                                onClick={handleFavoriteClick}
                                className={cn(actionButtonClasses, isFavorited ? "text-red-500 hover:text-red-400" : "text-neutral-400")}
                                aria-label={isFavorited ? "Unfavorite this image" : "Favorite this image"}
                                title={isFavorited ? "Unfavorite" : "Favorite"}
                            >
                                <motion.div {...{animate:heartControls}}>
                                    <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
                                </motion.div>
                            </motion.button>
                        )}
                        {onShareComparison && (
                            <button
                                onClick={handleShareComparisonClick}
                                className={actionButtonClasses}
                                aria-label={`Share comparison for ${caption}`}
                                title="Share Comparison"
                            >
                                <GitCompareArrows size={18} />
                            </button>
                        )}
                        {onRegenerate && (
                            <button
                                onClick={onRegenerate}
                                disabled={!canRegenerate}
                                className={actionButtonClasses}
                                aria-label={canRegenerate ? `Regenerate image for ${caption} (1 Credit)`: 'Not enough credits to regenerate'}
                                title={canRegenerate ? 'Regenerate (1 Credit)' : 'Not enough credits'}
                            >
                                <RefreshCw size={18} />
                            </button>
                        )}
                        {onDownload && (
                            <button
                                onClick={onDownload}
                                className={actionButtonClasses}
                                aria-label={`Download image for ${caption}`}
                                title="Download"
                            >
                                <Download size={18} />
                            </button>
                        )}
                        {onShare && (
                            <button
                                onClick={onShare}
                                className={actionButtonClasses}
                                aria-label={`Share image for ${caption}`}
                                title="Share"
                            >
                                <Share2 size={18} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(PhotoCard);