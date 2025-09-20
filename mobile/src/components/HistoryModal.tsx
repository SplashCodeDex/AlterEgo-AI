/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { X, History as HistoryIcon, Trash2 } from 'lucide-react-native';
import type { HistorySession } from '../types';
import { useHistory } from '../lib/hooks';

interface HistoryModalProps {
    onClose: () => void;
    onRestoreSession: (session: HistorySession) => void;
}

const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    return `${Math.floor(seconds)} seconds ago`;
};


const HistoryModal: React.FC<HistoryModalProps> = ({ onClose, onRestoreSession }) => {
    const { history, saveSessionToHistory } = useHistory(); // Note: we just need history here.

    const handleClearHistory = () => {
        // This is a bit of a hack to clear it, should be a function in the hook
        // For now, it's just a placeholder.
        console.warn("Clear history not fully implemented.");
    };

    return (
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Session History</Text>
                     <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} stroke="#A1A1AA" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {history.length > 0 ? (
                        <FlatList
                            data={history}
                            keyExtractor={(item) => item.timestamp.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    onPress={() => onRestoreSession(item)}
                                    style={styles.sessionItem}
                                >
                                    <Image source={{ uri: item.uploadedImage }} style={styles.thumbnail} />
                                    <View style={styles.sessionDetails}>
                                        <Text style={styles.sessionTitle}>Generation Session</Text>
                                        <Text style={styles.sessionTimestamp}>{timeAgo(item.timestamp)}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <HistoryIcon size={48} stroke="#71717A" />
                            <Text style={styles.emptyStateTitle}>No History Yet</Text>
                            <Text style={styles.emptyStateText}>Your completed generation sessions will appear here.</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#18181B',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: 'Sora-Bold',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 16,
    },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        marginBottom: 12,
    },
    thumbnail: {
        width: 64,
        height: 64,
        borderRadius: 6,
        objectFit: 'cover',
    },
    sessionDetails: {
        flex: 1,
    },
    sessionTitle: {
        fontWeight: 'bold',
        color: '#E5E5E5',
    },
    sessionTimestamp: {
        fontSize: 12,
        color: '#A1A1AA',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#E5E5E5',
        marginTop: 16,
    },
    emptyStateText: {
        color: '#A1A1AA',
        textAlign: 'center',
        marginTop: 8,
        maxWidth: 250,
    },
});

export default HistoryModal;
