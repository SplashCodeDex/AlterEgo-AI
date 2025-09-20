/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Logo from '../Logo';

interface AlbumViewProps {
  imageData: Record<string, string>;
  // These props are not used for rendering but are passed through for the capture callback
  action?: 'share' | 'download';
  title?: string;
  message?: string;
}

const AlbumView: React.FC<AlbumViewProps> = ({ imageData }) => {
  const images = Object.entries(imageData);
  const numCols = 2;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Logo size="large" bgClass="#1a1a1a" />
        <Text style={styles.subtitle}>My Multiverse</Text>
      </View>
      <View style={styles.grid}>
        {images.map(([caption, url], index) => (
          <View key={index} style={[styles.cell, { width: `${100 / numCols}%` }]}>
            <View style={styles.photoCard}>
              <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
              <Text style={styles.caption}>{caption}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 1240, // A3 aspect ratio-ish
    // height: 1754,
    backgroundColor: '#1a1a1a',
    padding: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  subtitle: {
    fontSize: 25,
    fontFamily: 'Inter-Regular',
    color: '#999',
    marginTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    padding: 25,
  },
  photoCard: {
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 20,
  },
  caption: {
    color: '#e0e0e0',
    fontSize: 30,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
});

export default AlbumView;