/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useCallback } from 'react';
import type { FavoritedImage, HistorySession, GeneratedImage } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Create a native toast solution.
// import { useToasts } from '../components/Toaster';

// TODO: Replace browser-based resizeImage with a native solution.
// import { resizeImage } from './albumUtils';


/**
 * A generic custom hook to manage state that syncs with native AsyncStorage.
 * It gracefully handles async reading, parsing, and saving data.
 * @param key The key to use in storage.
 * @param defaultValue The default value to use if nothing is in storage or if parsing fails.
 * @returns A stateful value, and a function to update it (identical to useState).
 */
// FIX: Export function to make it available for import in other files.
export function useAsyncStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue);

  // Effect to load the value from storage on mount
  useEffect(() => {
    const loadValue = async () => {
      try {
        const saved = await AsyncStorage.getItem(key);
        if (saved !== null) {
          setValue(JSON.parse(saved));
        }
      } catch (e) {
        console.error(`Failed to parse ${key} from AsyncStorage`, e);
      }
    };
    loadValue();
  }, [key]);

  // Effect to save the value to storage whenever it changes
  useEffect(() => {
    const saveValue = async () => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Failed to save ${key} to AsyncStorage`, e);
        }
    };
    saveValue();
  }, [key, value]);

  return [value, setValue];
}


/**
 * A dedicated hook for managing the user's favorited images.
 * It encapsulates the logic for adding, removing, and persisting favorites using native storage.
 * @returns An object containing the current favorite images and a function to toggle a favorite.
 */
export function useFavorites() {
    const [favoritedImages, setFavoritedImages] = useAsyncStorageState<Record<string, FavoritedImage>>('alterEgoFavorites', {});

    const toggleFavorite = useCallback((url: string, caption: string, originalUrl: string) => {
        setFavoritedImages(prev => {
            const newFavorites = { ...prev };
            if (newFavorites[url]) {
                delete newFavorites[url];
            } else {
                newFavorites[url] = { url, caption, originalUrl };
            }
            return newFavorites;
        });
    }, [setFavoritedImages]);

    return { favoritedImages, toggleFavorite };
}


/**
 * A hook for managing session history, persisted natively.
 * Encapsulates all interactions with AsyncStorage for storing and retrieving generation sessions.
 */
export function useHistory() {
    const [history, setHistory] = useAsyncStorageState<HistorySession[]>('alterEgoHistory', []);
    const [latestHistorySession, setLatestHistorySession] = useState<HistorySession | null>(null);
    // const { addToast } = useToasts(); // TODO: Implement native toasts
    
    useEffect(() => {
        if (history.length > 0) {
            // History is stored oldest to newest in this implementation, so get the last one.
            // Let's adjust to save newest first.
            setLatestHistorySession(history[0]);
        } else {
            setLatestHistorySession(null);
        }
    }, [history]);

    const saveSessionToHistory = useCallback(async (uploaded: string, generated: Record<string, GeneratedImage>) => {
        console.warn("saveSessionToHistory is not fully implemented. Image resizing needs a native solution.");
        // TODO: Re-implement resizing logic with a native library.
        try {
            const session: HistorySession = { 
                uploadedImage: uploaded, // Placeholder: use full-size image for now
                generatedImages: generated, // Placeholder: use full-size images for now
                timestamp: Date.now() 
            };
            
            setHistory(prevHistory => {
                const newHistory = [session, ...prevHistory];
                // Limit history to 5 sessions
                return newHistory.slice(0, 5);
            });
        } catch (e) {
            console.error("Failed to save session to history:", e);
            // addToast("Could not save session to history.", 'error');
        }
    }, [setHistory]);

    const refreshLatestHistorySession = useCallback(async () => {
         try {
            const savedHistory = await AsyncStorage.getItem('alterEgoHistory');
            if (savedHistory) {
                const currentHistory: HistorySession[] = JSON.parse(savedHistory);
                setLatestHistorySession(currentHistory.length > 0 ? currentHistory[0] : null);
            } else {
                setLatestHistorySession(null);
            }
        } catch(e) {
            console.error("Failed to refresh history from AsyncStorage", e);
            setLatestHistorySession(null);
        }
    }, []);

    return { history, latestHistorySession, saveSessionToHistory, refreshLatestHistorySession };
}