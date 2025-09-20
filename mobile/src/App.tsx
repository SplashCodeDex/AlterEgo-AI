/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import SplashScreen from './screens/SplashScreen';
import { ToastProvider } from './components/Toaster';
import { AppProvider } from './state/AppContext';

function App(): React.JSX.Element {
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => {
    // This simulates asset loading, state initialization, etc.
    const timer = setTimeout(() => {
        setAppLoaded(true);
    }, 2000); 
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={'light-content'} backgroundColor="#18181B" />
      {appLoaded ? (
        <ToastProvider>
          <AppProvider>
            <HomeScreen />
          </AppProvider>
        </ToastProvider>
      ) : (
        <SplashScreen />
      )}
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