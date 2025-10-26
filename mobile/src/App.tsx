/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { View, StatusBar, StyleSheet } from 'react-native';
import RNBootSplash from 'react-native-bootsplash';
import HomeScreen from './screens/HomeScreen';
import { ToastProvider } from './components/Toaster';
import { AppProvider } from './state/AppContext';
import appCheck from '@react-native-firebase/app-check';
import React, { useEffect } from 'react';

function App(): React.JSX.Element {
  
  useEffect(() => {
    async function initAppCheck() {
      try {
        await appCheck().activate('production'); // Use 'debug' for development
        console.log('Firebase App Check activated successfully.');
      } catch (error) {
        console.error('Failed to activate Firebase App Check:', error);
      }
    }
    initAppCheck();
  }, []);

  const handleOnReady = () => {
    RNBootSplash.hide({ fade: true });
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle={'light-content'} backgroundColor="#18181B" />
        <ToastProvider>
          <AppProvider onReady={handleOnReady}>
            <HomeScreen />
          </AppProvider>
        </ToastProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#18181B', // zinc-900
    paddingTop: getStatusBarHeight(),
  },
});

export default App;