/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error';

interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
    icon?: ReactNode;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType, icon?: ReactNode) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToasts = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToasts must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'success', icon?: ReactNode) => {
        const id = Date.now();
        setToasts(currentToasts => [...currentToasts, { id, message, type, icon }]);
        setTimeout(() => {
            setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: number) => {
        setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <Toaster toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};


interface ToasterProps {
    toasts: ToastMessage[];
    removeToast: (id: number) => void;
}

const Toaster: React.FC<ToasterProps> = ({ toasts, removeToast }) => {
    return (
        <div 
            aria-live="polite" 
            aria-atomic="true" 
            className="fixed bottom-4 right-4 z-[200] w-full max-w-sm"
        >
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div
                        key={toast.id}
                        {...{
                            layout: true,
                            initial: { opacity: 0, y: 50, scale: 0.3 },
                            animate: { opacity: 1, y: 0, scale: 1 },
                            exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
                        }}
                        className="mb-4"
                    >
                        <div className="bg-neutral-800 border border-white/20 rounded-lg shadow-2xl flex items-center p-4">
                            {toast.icon ? toast.icon : (
                                toast.type === 'success' ? (
                                    <CheckCircle className="text-green-500 mr-3" />
                                ) : (
                                    <AlertCircle className="text-red-500 mr-3" />
                                )
                            )}
                            <p className="flex-1 text-neutral-200 text-sm">{toast.message}</p>
                            <button onClick={() => removeToast(toast.id)} className="ml-4 p-1 text-neutral-500 hover:text-white" aria-label="Dismiss notification">
                                <X size={18} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};