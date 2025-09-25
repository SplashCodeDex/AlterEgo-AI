/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import type { Style } from '../constants';
import AnimatedButton from './AnimatedButton';

interface StyleSelectionGridProps {
    styles: Style[];
    selectedStyles: Set<string>;
    onToggleStyle: () => void;
}

const StyleItem = ({ item, isSelected, onToggle }: { item: Style, isSelected: boolean, onToggle: () => void }) => {
    return (
        <AnimatedButton 
            onPress={onToggle}
            style={[componentStyles.itemContainer, isSelected && componentStyles.itemSelected]}
        >
            <View style={{ flex: 1, justifyContent: 'flex-end'}}>
                {isSelected && (
                    <View style={componentStyles.checkIcon}>
                        <CheckCircle size={18} stroke="white" fill="#2563EB" />
                    </View>
                )}
                <Text style={componentStyles.itemText}>{item.caption}</Text>
            </View>
        </AnimatedButton>
    );
};

const StyleSelectionGrid: React.FC<StyleSelectionGridProps> = ({ styles, selectedStyles, onToggleStyle }) => {
    return (
        <FlatList
            data={styles}
            renderItem={({ item }) => (
                // FIX: Use componentStyles to avoid conflict with the `styles` prop.
                <View style={componentStyles.itemWrapper}>
                    <StyleItem
                        item={item}
                        isSelected={selectedStyles.has(item.caption)}
                        onToggle={onToggleStyle}
                    />
                </View>
            )}
            keyExtractor={item => item.caption}
            numColumns={3}
            // FIX: Use componentStyles to avoid conflict with the `styles` prop.
            contentContainerStyle={componentStyles.grid}
            scrollEnabled={false} 
        />
    );
};

// FIX: Renamed from `styles` to `componentStyles` to avoid conflict with the `styles` prop.
const componentStyles = StyleSheet.create({
    grid: {
        width: '100%',
    },
    itemWrapper: {
        flex: 1 / 3,
        padding: 6,
    },
    itemContainer: {
        flex: 1,
        aspectRatio: 1,
        backgroundColor: '#27272A', // neutral-800
        borderRadius: 8,
        padding: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    itemSelected: {
        borderColor: '#2563EB', // blue-600
    },
    itemText: {
        fontFamily: 'Inter-Bold',
        fontWeight: 'bold',
        fontSize: 14,
        color: 'white',
    },
    checkIcon: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 1,
    }
});

export default StyleSelectionGrid;