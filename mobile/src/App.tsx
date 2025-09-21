/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import RNBootSplash from 'react-native-bootsplash';
import HomeScreen from './screens/HomeScreen';
import { ToastProvider } from './components/Toaster';
import { AppProvider } from './state/AppContext';

function App(): React.JSX.Element {
  
  const handleOnReady = () => {
    RNBootSplash.hide({ fade: true });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={'light-content'} backgroundColor="#18181B" />
        <ToastProvider>
          <AppProvider onReady={handleOnReady}>
            <HomeScreen />
          </AppProvider>
        </ToastProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#18181B', // zinc-900
  },
});

export default App;