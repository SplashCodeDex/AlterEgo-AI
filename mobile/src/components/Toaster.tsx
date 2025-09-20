/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle, AlertCircle, X } from 'lucide-react-native';

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

interface ToasterProps {
    toasts: ToastMessage[];
    removeToast: (id: number) => void;
}

const Toaster: React.FC<ToasterProps> = ({ toasts, removeToast }) => {
    return (
        <View style={styles.toasterContainer}>
            {toasts.map(toast => (
                <View key={toast.id} style={styles.toast}>
                    <View style={styles.toastContent}>
                        {toast.icon ? toast.icon : (
                            toast.type === 'success' ? (
                                <CheckCircle color="#34D399" style={styles.icon} />
                            ) : (
                                <AlertCircle color="#F87171" style={styles.icon} />
                            )
                        )}
                        <Text style={styles.message}>{toast.message}</Text>
                        <TouchableOpacity onPress={() => removeToast(toast.id)} style={styles.closeButton}>
                            <X size={18} color="#A1A1AA" />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </View>
    );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'success', icon?: ReactNode) => {
        const id = Date.now();
        setToasts(currentToasts => [{ id, message, type, icon }, ...currentToasts]);
        const timer = setTimeout(() => {
            setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

    const removeToast = (id: number) => {
        setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            <View style={{flex: 1}}>
                {children}
                <Toaster toasts={toasts} removeToast={removeToast} />
            </View>
        </ToastContext.Provider>
    );
};

const styles = StyleSheet.create({
    toasterContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        zIndex: 200,
        gap: 12,
    },
    toast: {
        backgroundColor: '#27272A', // neutral-800
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    icon: {
        marginRight: 12,
    },
    message: {
        flex: 1,
        color: '#E5E5E5',
        fontSize: 14,
    },
    closeButton: {
        marginLeft: 16,
        padding: 4,
    }
});