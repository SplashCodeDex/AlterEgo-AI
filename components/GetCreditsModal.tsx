/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Crown, Coins, Clapperboard, Check, Zap, Infinity, Palette } from 'lucide-react';

interface GetCreditsModalProps {
    onClose: () => void;
    setCredits: React.Dispatch<React.SetStateAction<number>>;
    setIsPro: React.Dispatch<React.SetStateAction<boolean>>;
}

const ProFeature = ({ children }: { children: React.ReactNode }) => (
    <li className="flex items-center gap-3">
        <Check className="text-green-400" size={20} />
        <span>{children}</span>
    </li>
);

const GetCreditsModal: React.FC<GetCreditsModalProps> = ({ onClose, setCredits, setIsPro }) => {
    const [isWatchingAd, setIsWatchingAd] = useState(false);
    const [purchasingState, setPurchasingState] = useState<'idle' | 'purchasing' | 'purchased'>('idle');
    
    const handleSubscribe = () => {
        setPurchasingState('purchasing');
        setTimeout(() => {
            setIsPro(true);
            setPurchasingState('purchased');
            setTimeout(() => {
                onClose();
                setPurchasingState('idle');
            }, 1500);
        }, 2000);
    };

    const handleBuyCredits = (amount: number) => {
        setPurchasingState('purchasing');
        setTimeout(() => {
            setCredits(prev => prev + amount);
            setPurchasingState('purchased');
            setTimeout(() => {
                onClose();
                setPurchasingState('idle');
            }, 1500);
        }, 2000);
    };

    const handleWatchAd = () => {
        setIsWatchingAd(true);
        setTimeout(() => {
            setCredits(prev => prev + 2); // Award 2 credits
            setIsWatchingAd(false);
            onClose();
        }, 3000); // Simulate ad watch time
    };

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
                aria-labelledby="get-credits-title"
                {...{
                    initial: { scale: 0.9, opacity: 0, y: 20 },
                    animate: { scale: 1, opacity: 1, y: 0 },
                    exit: { scale: 0.9, opacity: 0, y: 20 },
                    transition: { type: 'spring', stiffness: 300, damping: 30 },
                }}
                className="bg-neutral-900 border border-white/20 rounded-2xl w-full max-w-lg shadow-2xl text-white relative flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 id="get-credits-title" className="text-2xl font-bold font-sora">Get More Credits</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors" aria-label="Close modal">
                        <X size={24} />
                    </button>
                </header>

                <div className="p-6 sm:p-8 overflow-y-auto space-y-8">
                    {/* Pro Section */}
                    <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-6 rounded-xl border border-blue-500/50 text-center">
                        <div className="flex justify-center items-center gap-3 mb-3">
                            <Crown className="text-yellow-400" size={28} />
                            <h3 className="text-2xl font-bold">AlterEgo AI PRO</h3>
                        </div>
                        <ul className="text-neutral-300 space-y-2 mb-6 text-left inline-block">
                            <ProFeature><Infinity size={16} className="inline mr-1" /> Unlimited Generations</ProFeature>
                            <ProFeature><Zap size={16} className="inline mr-1" /> No Watermarks</ProFeature>
                            <ProFeature><Palette size={16} className="inline mr-1" /> Access to All Styles</ProFeature>
                        </ul>
                        <button onClick={handleSubscribe} disabled={purchasingState !== 'idle'} className="w-full bg-blue-600 font-bold py-3 px-6 rounded-lg hover:bg-blue-500 transition-colors text-lg shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed">
                           {purchasingState === 'purchasing' ? 'Purchasing...' : purchasingState === 'purchased' ? 'Purchased!' : 'Subscribe Now'}
                        </button>
                    </div>

                    {/* Credit Packs */}
                    <div>
                        <h3 className="text-xl font-bold text-center mb-4">Or Buy Credit Packs</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <button onClick={() => handleBuyCredits(30)} disabled={purchasingState !== 'idle'} className="credit-pack-button disabled:opacity-50 disabled:cursor-not-allowed">
                                <span className="text-2xl sm:text-3xl font-bold">30</span>
                                <span className="text-neutral-400">Credits</span>
                            </button>
                             <button onClick={() => handleBuyCredits(100)} disabled={purchasingState !== 'idle'} className="credit-pack-button border-blue-500 ring-2 ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                <span className="absolute -top-3 bg-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">BEST VALUE</span>
                                <span className="text-2xl sm:text-3xl font-bold">100</span>
                                <span className="text-neutral-400">Credits</span>
                            </button>
                             <button onClick={() => handleBuyCredits(500)} disabled={purchasingState !== 'idle'} className="credit-pack-button disabled:opacity-50 disabled:cursor-not-allowed">
                                <span className="text-2xl sm:text-3xl font-bold">500</span>
                                <span className="text-neutral-400">Credits</span>
                            </button>
                        </div>
                    </div>

                    {/* Rewarded Ad */}
                    <div className="text-center">
                         <h3 className="text-xl font-bold text-center mb-4">Need a Few More?</h3>
                        <button onClick={handleWatchAd} disabled={isWatchingAd || purchasingState !== 'idle'} className="w-full sm:w-auto bg-green-600/20 border border-green-500/50 text-green-300 font-bold py-3 px-8 rounded-lg hover:bg-green-600/30 transition-colors flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-wait mx-auto">
                            <Clapperboard size={20} />
                            <span>{isWatchingAd ? 'Loading Ad...' : 'Watch Ad for 2 Credits'}</span>
                        </button>
                    </div>
                </div>
                 <style>{`
                    .credit-pack-button {
                        @apply relative flex flex-col items-center justify-center bg-neutral-800 p-4 rounded-lg border border-neutral-700 hover:border-neutral-500 transition-all transform hover:scale-105;
                    }
                `}</style>
            </motion.div>
        </motion.div>
    );
};

export default GetCreditsModal;
