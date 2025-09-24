/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Heart, GitCompareArrows } from 'lucide-react';

interface FavoritedImage {
    url: string;
    caption: string;
    originalUrl: string;
}

interface FavoritesModalProps {
    images: FavoritedImage[];
    onClose: () => void;
    onToggleFavorite: (url: string, caption: string, originalUrl: string) => void;
    onDownload: (url: string, caption: string) => Promise<void>;
    onShare: (url: string, caption: string) => Promise<void>;
    onShareComparison: (originalUrl: string, generatedUrl: string, caption: string) => void;
}

const FavoriteItem: React.FC<{
    image: FavoritedImage;
    onToggleFavorite: (url: string, caption: string, originalUrl: string) => void;
    onDownload: (url: string, caption: string) => Promise<void>;
    onShare: (url: string, caption: string) => Promise<void>;
    onShareComparison: (originalUrl: string, generatedUrl: string, caption: string) => void;
}> = ({ image, onToggleFavorite, onDownload, onShare, onShareComparison }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            await onDownload(image.url, image.caption);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleShare = async () => {
        setIsSharing(true);
        try {
            await onShare(image.url, image.caption);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <motion.div 
            {...{
                layout: true,
                initial: { opacity: 0, scale: 0.8 },
                animate: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.8 },
                transition: { type: 'spring', stiffness: 300, damping: 30 },
            }}
            className="relative group aspect-square rounded-lg overflow-hidden bg-neutral-800"
        >
            <img src={image.url} alt={image.caption} className="w-full h-full object-cover" />
            <AnimatePresence>
                {(isDownloading || isSharing) && (
                    <motion.div 
                        {...{
                            initial: { opacity: 0 },
                            animate: { opacity: 1 },
                            exit: { opacity: 0 },
                        }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center"
                    >
                        {isDownloading && <Download className="text-white animate-pulse" />}
                        {isSharing && <Share2 className="text-white animate-pulse" />}
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2">
                <p className="text-white text-xs font-bold truncate shadow-black [text-shadow:_0_1px_4px_var(--tw-shadow-color)]">{image.caption}</p>
                <div className="flex justify-end items-center gap-1">
                     <button
                        onClick={() => onToggleFavorite(image.url, image.caption, image.originalUrl)}
                        className="p-1.5 bg-white/10 rounded-full text-red-500 hover:bg-white/20 transition-colors"
                        title="Unfavorite"
                    >
                        <Heart size={16} fill="currentColor" />
                    </button>
                    <button
                        onClick={() => onShareComparison(image.originalUrl, image.url, image.caption)}
                        className="p-1.5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                        title="Share Comparison"
                    >
                        <GitCompareArrows size={16} />
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="p-1.5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                        title="Download"
                    >
                        <Download size={16} />
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="p-1.5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                        title="Share"
                    >
                        <Share2 size={16} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};


const FavoritesModal: React.FC<FavoritesModalProps> = ({ images, onClose, onToggleFavorite, onDownload, onShare, onShareComparison }) => {
    return (
        <motion.div
            {...{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
            }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="favorites-title"
                {...{
                    initial: { scale: 0.9, opacity: 0, y: 20 },
                    animate: { scale: 1, opacity: 1, y: 0 },
                    exit: { scale: 0.9, opacity: 0, y: 20 },
                    transition: { type: 'spring', stiffness: 300, damping: 30 },
                }}
                className="bg-neutral-900 border border-white/20 rounded-2xl w-full max-w-4xl shadow-2xl text-white relative flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
                    <h2 id="favorites-title" className="text-xl sm:text-2xl font-bold font-sora">Your Favorites</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors" aria-label="Close modal">
                        <X size={24} />
                    </button>
                </header>

                <div className="p-4 sm:p-6 overflow-y-auto">
                    {images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            <AnimatePresence>
                                {images.map(image => (
                                    <FavoriteItem 
                                        key={image.url} 
                                        image={image} 
                                        onToggleFavorite={onToggleFavorite}
                                        onDownload={onDownload}
                                        onShare={onShare}
                                        onShareComparison={onShareComparison}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center text-neutral-500 py-16">
                            <Heart size={48} className="mb-4" />
                            <h3 className="text-xl font-bold text-neutral-300">No Favorites Yet</h3>
                            <p className="max-w-xs mt-1">Tap the heart icon on any generated image to save it here.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default FavoritesModal;
