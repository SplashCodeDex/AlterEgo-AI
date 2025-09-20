/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Crown, LayoutGrid, Star, History } from 'lucide-react';
import Logo from './Logo';

interface HeaderProps {
    credits: number;
    isPro: boolean;
    onGetCredits: () => void;
    onShowFavorites: () => void;
    onShowHistory: () => void;
}


const Header: React.FC<HeaderProps> = ({ credits, isPro, onGetCredits, onShowFavorites, onShowHistory }) => {
    return (
        <motion.header 
            {...{
                initial: { y: -100, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                transition: { type: 'spring', stiffness: 100, damping: 20, delay: 0.2 },
            }}
            className="fixed top-0 left-0 right-0 bg-black/30 backdrop-blur-lg p-3 sm:p-4 z-50 border-b border-white/10"
        >
            <div className="max-w-screen-xl mx-auto flex justify-between items-center px-2 sm:px-4">
                <Logo size="small" />

                <div className="flex items-center gap-2 sm:gap-3">
                    {isPro ? (
                        <div className="flex items-center gap-2 text-yellow-400 font-bold bg-yellow-400/10 border border-yellow-400/30 rounded-full px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm">
                            <Crown size={16} />
                            <span>PRO</span>
                        </div>
                    ) : (
                         <button onClick={onGetCredits} title="Get more credits" className="flex items-center gap-2 font-semibold text-white bg-white/5 border border-white/20 rounded-full px-2.5 py-1 text-sm sm:px-3 sm:py-1.5 sm:text-base hover:bg-white/10 transition-colors">
                            <Coins size={20} className="text-yellow-500" />
                            <span>{credits}</span>
                        </button>
                    )}

                    <button
                        onClick={onShowHistory}
                        className="p-2 sm:p-2.5 rounded-full text-neutral-300 bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                        title="View History"
                    >
                        <History size={20} />
                    </button>
                    
                    <button
                        onClick={onShowFavorites}
                        className="p-2 sm:p-2.5 rounded-full text-neutral-300 bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                        title="View Favorites"
                    >
                        <Star size={20} />
                    </button>

                     <a
                        href="https://aistudio.google.com/apps"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 sm:p-2.5 rounded-full text-neutral-300 bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                        title="More Apps"
                    >
                        <LayoutGrid size={20} />
                    </a>
                </div>
            </div>
        </motion.header>
    );
};

export default React.memo(Header);