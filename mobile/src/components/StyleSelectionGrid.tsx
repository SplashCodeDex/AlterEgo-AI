/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import type { Style } from '../constants';

interface StyleSelectionGridProps {
    styles: Style[];
    selectedStyles: Set<string>;
    onToggleStyle: (caption: string) => void;
}

const StyleItem = ({ item, isSelected, onToggle }: { item: Style, isSelected: boolean, onToggle: () => void }) => {
    return (
        <TouchableOpacity 
            onPress={onToggle}
            style={[sheetStyles.itemContainer, isSelected && sheetStyles.itemSelected]}
        >
            {isSelected && (
                <View style={sheetStyles.checkIcon}>
                    <CheckCircle size={18} stroke="white" fill="#2563EB" />
                </View>
            )}
            <Text style={sheetStyles.itemText}>{item.caption}</Text>
        </TouchableOpacity>
    );
};

const StyleSelectionGrid: React.FC<StyleSelectionGridProps> = ({ styles, selectedStyles, onToggleStyle }) => {
    return (
        <FlatList
            data={styles}
            renderItem={({ item }) => (
                <StyleItem
                    item={item}
                    isSelected={selectedStyles.has(item.caption)}
                    onToggle={() => onToggleStyle(item.caption)}
                />
            )}
            keyExtractor={item => item.caption}
            numColumns={3}
            contentContainerStyle={sheetStyles.grid}
            // Disabling scroll for now as the list is short, can be enabled if needed
            scrollEnabled={false} 
        />
    );
};

// FIX: Renamed from `styles` to `sheetStyles` to avoid a naming collision with the `styles` prop passed to the component.
const sheetStyles = StyleSheet.create({
    grid: {
        width: '100%',
    },
    itemContainer: {
        flex: 1,
        aspectRatio: 1,
        backgroundColor: '#27272A', // neutral-800
        borderRadius: 8,
        justifyContent: 'flex-end',
        padding: 8,
        margin: 6,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    itemSelected: {
        borderColor: '#2563EB', // blue-600
        transform: [{ scale: 1.05 }],
    },
    itemText: {
        fontFamily: 'Inter-Bold',
        fontWeight: 'bold',
        fontSize: 14,
        color: 'white',
    },
    checkIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1,
    }
});

export default StyleSelectionGrid;
