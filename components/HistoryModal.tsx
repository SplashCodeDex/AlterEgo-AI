/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History as HistoryIcon, Trash2 } from 'lucide-react';
import type { HistorySession } from '../types';


interface HistoryModalProps {
    onClose: () => void;
    onRestoreSession: (session: HistorySession) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ onClose, onRestoreSession }) => {
    const [history, setHistory] = useState<HistorySession[]>([]);
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);

    useEffect(() => {
        try {
            const savedHistory = sessionStorage.getItem('alterEgoHistory');
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (e) {
            console.error("Failed to parse history from sessionStorage", e);
        }
    }, []);

    const handleClearHistory = () => {
        setIsConfirmingClear(true);
    };
    
    const handleConfirmClear = () => {
        sessionStorage.removeItem('alterEgoHistory');
        setHistory([]);
        setIsConfirmingClear(false);
    };

    const timeAgo = (timestamp: number) => {
        const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
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
                aria-labelledby="history-title"
                {...{
                    initial: { scale: 0.9, opacity: 0, y: 20 },
                    animate: { scale: 1, opacity: 1, y: 0 },
                    exit: { scale: 0.9, opacity: 0, y: 20 },
                    transition: { type: 'spring', stiffness: 300, damping: 30 },
                }}
                className="bg-neutral-900 border border-white/20 rounded-2xl w-full max-w-2xl shadow-2xl text-white relative flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
                    <h2 id="history-title" className="text-xl sm:text-2xl font-bold font-sora">Session History</h2>
                    <div className="flex items-center gap-4">
                        {history.length > 0 && (
                             <AnimatePresence mode="wait">
                                {isConfirmingClear ? (
                                    <motion.div
                                        key="confirm"
                                        {...{
                                            initial: { opacity: 0, x: 10 },
                                            animate: { opacity: 1, x: 0 },
                                            exit: { opacity: 0, x: 10 },
                                        }}
                                        className="flex items-center gap-3 text-sm"
                                    >
                                        <span className="text-neutral-400">Are you sure?</span>
                                        <button onClick={handleConfirmClear} className="font-bold text-red-400 hover:text-red-300 transition-colors">Yes</button>
                                        <button onClick={() => setIsConfirmingClear(false)} className="font-bold text-neutral-300 hover:text-white transition-colors">No</button>
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        key="clear"
                                        {...{
                                            initial: { opacity: 0, x: -10 },
                                            animate: { opacity: 1, x: 0 },
                                            exit: { opacity: 0, x: -10 },
                                        }}
                                        onClick={handleClearHistory} 
                                        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} /> Clear All
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        )}
                        <button onClick={onClose} className="p-1 rounded-full text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors" aria-label="Close modal">
                            <X size={24} />
                        </button>
                    </div>
                </header>

                <div className="p-4 sm:p-6 overflow-y-auto">
                    {history.length > 0 ? (
                        <ul className="space-y-4">
                            <AnimatePresence>
                                {history.map((session, index) => (
                                    <motion.li
                                        key={session.timestamp}
                                        {...{
                                            layout: true,
                                            initial: { opacity: 0, y: 20 },
                                            animate: { opacity: 1, y: 0 },
                                            exit: { opacity: 0, x: -20 },
                                            transition: { delay: index * 0.05 },
                                        }}
                                    >
                                        <button 
                                            onClick={() => onRestoreSession(session)}
                                            className="w-full flex items-center gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
                                        >
                                            <img src={session.uploadedImage} alt="Uploaded thumbnail" className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                                            <div className="flex-grow">
                                                <p className="font-bold text-neutral-200">Generation Session</p>
                                                <p className="text-sm text-neutral-400">{timeAgo(session.timestamp)}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    {Object.values(session.generatedImages).slice(0, 5).map((image, i) => (
                                                        <img key={i} src={image.url} className="w-5 h-5 rounded-full object-cover" />
                                                    ))}
                                                </div>
                                            </div>
                                        </button>
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center text-neutral-500 py-16">
                            <HistoryIcon size={48} className="mb-4" />
                            <h3 className="text-xl font-bold text-neutral-300">No History Yet</h3>
                            <p className="max-w-xs mt-1">Your completed generation sessions will appear here.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default HistoryModal;
