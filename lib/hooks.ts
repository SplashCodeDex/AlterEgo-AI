/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useCallback } from 'react';
import type { FavoritedImage, HistorySession, GeneratedImage } from './types';
import { useToasts } from '../components/Toaster';
import { resizeImage } from './albumUtils';

function useStorageState<T>(storage: Storage, key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = storage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      return defaultValue;
    } catch (e) {
      console.error(`Failed to parse ${key} from storage`, e);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save ${key} to storage`, e);
    }
  }, [key, value, storage]);

  return [value, setValue];
}

export function useLocalStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    return useStorageState(localStorage, key, defaultValue);
}

function useSessionStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    return useStorageState(sessionStorage, key, defaultValue);
}

export function useFavorites() {
    const [favoritedImages, setFavoritedImages] = useLocalStorageState<Record<string, FavoritedImage>>('alterEgoFavorites', {});

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

export function useHistory() {
    const [history, setHistory] = useSessionStorageState<HistorySession[]>('alterEgoHistory', []);
    const [latestHistorySession, setLatestHistorySession] = useState<HistorySession | null>(null);
    const { addToast } = useToasts();
    
    useEffect(() => {
        if (history.length > 0) {
            setLatestHistorySession(history[0]);
        } else {
            setLatestHistorySession(null);
        }
    }, [history]);

    const saveSessionToHistory = useCallback(async (uploaded: string, generated: Record<string, GeneratedImage>) => {
        try {
            const resizedUploaded = await resizeImage(uploaded, 400); 
            const resizedGenerated: Record<string, GeneratedImage> = {};
            
            for (const key in generated) {
                const img = generated[key];
                if (img.status === 'done' && img.url) {
                    const resizedUrl = await resizeImage(img.url, 400);
                    resizedGenerated[key] = { ...img, url: resizedUrl };
                } else {
                    resizedGenerated[key] = img;
                }
            }

            const session: HistorySession = { 
                uploadedImage: resizedUploaded,
                generatedImages: resizedGenerated,
                timestamp: Date.now() 
            };
            
            setHistory(prevHistory => {
                const newHistory = [session, ...prevHistory];
                return newHistory.slice(0, 5);
            });
        } catch (e) {
            console.error("Failed to save session to history:", e);
            addToast("Could not save session to history.", 'error');
        }
    }, [setHistory, addToast]);

    const refreshLatestHistorySession = useCallback(() => {
         try {
            const savedHistory = sessionStorage.getItem('alterEgoHistory');
            if (savedHistory) {
                const currentHistory: HistorySession[] = JSON.parse(savedHistory);
                setLatestHistorySession(currentHistory.length > 0 ? currentHistory[0] : null);
            } else {
                setLatestHistorySession(null);
            }
        } catch(e) {
            console.error("Failed to refresh history from sessionStorage", e);
            setLatestHistorySession(null);
        }
    }, []);

    return { history, latestHistorySession, saveSessionToHistory, refreshLatestHistorySession };
}
