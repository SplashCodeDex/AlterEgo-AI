/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Logo from '../Logo';

interface ComparisonViewProps {
  originalImageUrl: string;
  generatedImageUrl: string;
  caption: string;
  // These props are not used for rendering but are passed through for the capture callback
  action?: 'share' | 'download';
  title?: string;
  message?: string;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ originalImageUrl, generatedImageUrl, caption }) => {
  return (
    <View style={styles.container}>
      <View style={styles.imageRow}>
        <View style={styles.imageContainer}>
          <Text style={styles.label}>Original</Text>
          <Image source={{ uri: originalImageUrl }} style={styles.image} resizeMode="cover" />
        </View>
        <View style={styles.imageContainer}>
          <Text style={styles.label}>{caption}</Text>
          <Image source={{ uri: generatedImageUrl }} style={styles.image} resizeMode="cover" />
        </View>
      </View>
      <Logo size="small" bgClass="#1a1a1a" style={styles.logo} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 1200,
    height: 700,
    backgroundColor: '#1a1a1a',
    padding: 40,
    justifyContent: 'space-between',
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    gap: 40,
  },
  imageContainer: {
    flex: 1,
  },
  label: {
    color: '#e0e0e0',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  image: {
    flex: 1,
    borderRadius: 12,
  },
  logo: {
    alignSelf: 'center',
    marginTop: 20,
  }
});

export default ComparisonView;