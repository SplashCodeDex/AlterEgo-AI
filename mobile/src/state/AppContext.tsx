/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { createContext, useContext, useReducer, useCallback, useRef, ReactNode, useEffect, useState } from 'react';
import { useAsyncStorageState, useHistory, useFavorites } from '../lib/hooks';
import { useIAP } from '../hooks/useIAP';
import { useImageProcessor } from '../hooks/useImageProcessor';
import { useToasts } from '../components/Toaster';
import { generateStyledImage } from '../services/geminiService';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { saveToCameraRoll, shareImage } from '../lib/nativeSharing';
import type { GeneratedImage, HistorySession, FavoritedImage } from '../types';
import { DEFAULT_STYLES, ALL_STYLES, SURPRISE_STYLES, Style } from '../constants';
import ComparisonView from '../components/shareables/ComparisonView';
import AlbumView from '../components/shareables/AlbumView';
import ViewShot from 'react-native-view-shot';

// --- STATE AND REDUCER ---

interface AppState {
    appState: 'idle' | 'image-uploaded' | 'generating' | 'results-shown';
    uploadedImage: string | null;
    generatedImages: Record<string, GeneratedImage>;
    isSubscriptionModalOpen: boolean;
    isHistoryModalOpen: boolean;
    isFavoritesModalOpen: boolean;
    generatingIndex: number | null;
    activeSessionStyles: string[];
    activeIndex: number;
    isRestoredSession: boolean;
    currentStyles: Style[];
    selectedStyles: Set<string>;
    shareableView: ReactNode | null;
    credits: number;
    isPro: boolean;
    favoritedImages: Record<string, FavoritedImage>;
    latestHistorySession: HistorySession | null;
}

type AppAction =
    | { type: 'SET_APP_STATE'; payload: AppState['appState'] }
    | { type: 'SET_UPLOADED_IMAGE'; payload: string | null }
    | { type: 'SET_GENERATED_IMAGES'; payload: Record<string, GeneratedImage> }
    | { type: 'UPDATE_GENERATED_IMAGE'; payload: { style: string; image: GeneratedImage } }
    | { type: 'SET_MODAL_VISIBILITY'; payload: { modal: 'subscription' | 'history' | 'favorites'; visible: boolean } }
    | { type: 'SET_GENERATING_INDEX'; payload: number | null }
    | { type: 'SET_ACTIVE_SESSION_STYLES'; payload: string[] }
    | { type: 'SET_ACTIVE_INDEX'; payload: number }
    | { type: 'SET_IS_RESTORED_SESSION'; payload: boolean }
    | { type: 'SET_CURRENT_STYLES'; payload: Style[] }
    | { type: 'TOGGLE_SELECTED_STYLE'; payload: string }
    | { type: 'SET_SELECTED_STYLES'; payload: Set<string> }
    | { type: 'SET_SHAREABLE_VIEW'; payload: ReactNode | null }
    | { type: 'SET_LATEST_HISTORY_SESSION'; payload: HistorySession | null }
    | { type: 'RESET_STATE' };

const initialState: AppState = {
    appState: 'idle',
    uploadedImage: null,
    generatedImages: {},
    isSubscriptionModalOpen: false,
    isHistoryModalOpen: false,
    isFavoritesModalOpen: false,
    generatingIndex: null,
    activeSessionStyles: [],
    activeIndex: 0,
    isRestoredSession: false,
    currentStyles: DEFAULT_STYLES,
    selectedStyles: new Set(DEFAULT_STYLES.map(s => s.caption)),
    shareableView: null,
    credits: 18,
    isPro: false,
    favoritedImages: {},
    latestHistorySession: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'SET_APP_STATE':
            return { ...state, appState: action.payload };
        case 'SET_UPLOADED_IMAGE':
            return { ...state, uploadedImage: action.payload };
        case 'SET_GENERATED_IMAGES':
            return { ...state, generatedImages: action.payload };
        case 'UPDATE_GENERATED_IMAGE':
            return { ...state, generatedImages: { ...state.generatedImages, [action.payload.style]: action.payload.image } };
        case 'SET_MODAL_VISIBILITY':
            if (action.payload.modal === 'subscription') return { ...state, isSubscriptionModalOpen: action.payload.visible };
            if (action.payload.modal === 'history') return { ...state, isHistoryModalOpen: action.payload.visible };
            if (action.payload.modal === 'favorites') return { ...state, isFavoritesModalOpen: action.payload.visible };
            return state;
        case 'SET_GENERATING_INDEX':
            return { ...state, generatingIndex: action.payload };
        case 'SET_ACTIVE_SESSION_STYLES':
            return { ...state, activeSessionStyles: action.payload };
        case 'SET_ACTIVE_INDEX':
            return { ...state, activeIndex: action.payload };
        case 'SET_IS_RESTORED_SESSION':
            return { ...state, isRestoredSession: action.payload };
        case 'SET_CURRENT_STYLES':
            return { ...state, currentStyles: action.payload };
        case 'TOGGLE_SELECTED_STYLE':
            const newSet = new Set(state.selectedStyles);
            if (newSet.has(action.payload)) newSet.delete(action.payload);
            else newSet.add(action.payload);
            return { ...state, selectedStyles: newSet };
        case 'SET_SELECTED_STYLES':
            return { ...state, selectedStyles: action.payload };
        case 'SET_SHAREABLE_VIEW':
            return { ...state, shareableView: action.payload };
        case 'SET_LATEST_HISTORY_SESSION':
            return { ...state, latestHistorySession: action.payload };
        case 'RESET_STATE':
            return {
                ...state,
                appState: 'idle',
                uploadedImage: null,
                generatedImages: {},
                activeIndex: 0,
                activeSessionStyles: [],
                isRestoredSession: false,
            };
        default:
            return state;
    }
};

// --- CONTEXT AND PROVIDER ---

interface AppContextType {
    state: AppState;
    actions: {
        handleUploadPhoto: () => void;
        handleTakePhoto: () => void;
        handleToggleStyle: (caption: string) => void;
        handleShuffleStyles: () => void;
        handleGenerateClick: () => Promise<void>;
        handleRegenerateStyle: (style: string) => Promise<void>;
        handleReset: () => void;
        handleRestoreSession: (session: HistorySession) => void;
        handleShareComparison: (originalUrl: string, generatedUrl: string, caption: string) => void;
        handleDownloadAlbum: () => void;
        handleShareAlbum: () => void;
        setActiveIndex: (index: number) => void;
        openModal: (modal: 'subscription' | 'history' | 'favorites') => void;
        closeModal: (modal: 'subscription' | 'history' | 'favorites') => void;
        onSuccessfulPurchase: (sku: string) => void;
        toggleFavorite: (url: string, caption: string, originalUrl: string) => void;
    };
    iap: ReturnType<typeof useIAP>;
    ImageProcessorComponent: JSX.Element | null;
    viewShotRef: React.RefObject<ViewShot>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    
    // Child Hooks
    const [credits, setCredits] = useAsyncStorageState('alterEgoCredits', 18);
    const iap = useIAP();
    const { history, latestHistorySession, saveSessionToHistory, refreshLatestHistorySession } = useHistory();
    const { favoritedImages, toggleFavorite } = useFavorites();
    const { addToast } = useToasts();
    const { processImageWithWatermark, ImageProcessorComponent } = useImageProcessor();
    const viewShotRef = useRef<ViewShot>(null);
    
    // Sync state from hooks to reducer state
    useEffect(() => {
        initialState.credits = credits;
        initialState.isPro = iap.isPro;
        initialState.favoritedImages = favoritedImages;
        initialState.latestHistorySession = latestHistorySession;
    }, [credits, iap.isPro, favoritedImages, latestHistorySession]);

    // --- ACTIONS AND LOGIC ---
    
    const handleImageResponse = useCallback((response: ImagePickerResponse) => {
        if (response.didCancel) return;
        if (response.errorCode) {
            addToast('Could not select image. Please try again.', 'error');
            return;
        }
        if (response.assets && response.assets[0].uri) {
            const uri = `data:${response.assets[0].type};base64,${response.assets[0].base64}`;
            dispatch({ type: 'SET_UPLOADED_IMAGE', payload: uri });
            dispatch({ type: 'SET_APP_STATE', payload: 'image-uploaded' });
            dispatch({ type: 'SET_GENERATED_IMAGES', payload: {} });
            dispatch({ type: 'SET_ACTIVE_INDEX', payload: 0 });
            dispatch({ type: 'SET_CURRENT_STYLES', payload: DEFAULT_STYLES });
            dispatch({ type: 'SET_SELECTED_STYLES', payload: new Set(DEFAULT_STYLES.map(s => s.caption)) });
            dispatch({ type: 'SET_IS_RESTORED_SESSION', payload: false });
        }
    }, [addToast]);

    const handleUploadPhoto = useCallback(() => {
        launchImageLibrary({ mediaType: 'photo', quality: 1, includeBase64: true }, handleImageResponse);
    }, [handleImageResponse]);

    const handleTakePhoto = useCallback(() => {
        launchCamera({ mediaType: 'photo', quality: 1, cameraType: 'front', includeBase64: true }, handleImageResponse);
    }, [handleImageResponse]);
    
    const handleToggleStyle = (caption: string) => dispatch({ type: 'TOGGLE_SELECTED_STYLE', payload: caption });
    const setActiveIndex = (index: number) => dispatch({ type: 'SET_ACTIVE_INDEX', payload: index });
    const openModal = (modal: 'subscription' | 'history' | 'favorites') => dispatch({ type: 'SET_MODAL_VISIBILITY', payload: { modal, visible: true } });
    const closeModal = (modal: 'subscription' | 'history' | 'favorites') => dispatch({ type: 'SET_MODAL_VISIBILITY', payload: { modal, visible: false } });

    const handleShuffleStyles = () => {
        const remainingStyles = ALL_STYLES.filter(style => !state.currentStyles.some(cs => cs.caption === style.caption));
        const shuffled = [...remainingStyles].sort(() => 0.5 - Math.random());
        const surpriseStyle = ALL_STYLES.find(s => s.caption === 'Surprise Me!') ?? DEFAULT_STYLES.find(s => s.caption === 'Surprise Me!')!;
        const newStyles = [...shuffled.slice(0, 5), surpriseStyle];
        dispatch({ type: 'SET_CURRENT_STYLES', payload: newStyles.sort(() => (Math.random() > .5) ? 1 : -1) });
        dispatch({ type: 'SET_SELECTED_STYLES', payload: new Set(newStyles.map(s => s.caption)) });
    };

    const handleGenerateClick = useCallback(async () => {
        if (!state.uploadedImage || state.selectedStyles.size === 0) return;
        
        const generationCost = state.selectedStyles.size;
        if (!iap.isPro && credits < generationCost) {
            openModal('subscription');
            return;
        }

        if (!iap.isPro) setCredits(prev => prev - generationCost);
        
        dispatch({ type: 'SET_IS_RESTORED_SESSION', payload: false });
        dispatch({ type: 'SET_APP_STATE', payload: 'generating' });

        const stylesToGenerate = state.currentStyles
            .filter(style => state.selectedStyles.has(style.caption))
            .map(s => s.caption);
        dispatch({ type: 'SET_ACTIVE_SESSION_STYLES', payload: stylesToGenerate });
        
        const initialImages: Record<string, GeneratedImage> = {};
        const generationQueue = stylesToGenerate.map(style => {
             let caption = style;
            if (style === 'Surprise Me!') {
                caption = SURPRISE_STYLES[Math.floor(Math.random() * SURPRISE_STYLES.length)];
            }
            initialImages[style] = { status: 'pending', caption };
            return { originalStyle: style, caption };
        });
        
        dispatch({ type: 'SET_GENERATED_IMAGES', payload: initialImages });
        let finalImages = { ...initialImages };

        for (let i = 0; i < generationQueue.length; i++) {
            dispatch({ type: 'SET_GENERATING_INDEX', payload: i });
            const { originalStyle, caption } = generationQueue[i];
            
            try {
                const prompt = `Reimagine the person in this photo in the style of ${caption}.`;
                const resultUrl = await generateStyledImage(state.uploadedImage, prompt, caption);
                const watermarkedUrl = await processImageWithWatermark(resultUrl);
                const newImage: GeneratedImage = { ...finalImages[originalStyle], status: 'done', url: watermarkedUrl };
                finalImages = { ...finalImages, [originalStyle]: newImage };
                dispatch({ type: 'UPDATE_GENERATED_IMAGE', payload: { style: originalStyle, image: newImage } });
            } catch (err) {
                 const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                 const errorImage: GeneratedImage = { ...finalImages[originalStyle], status: 'error', error: errorMessage };
                 finalImages = { ...finalImages, [originalStyle]: errorImage };
                 dispatch({ type: 'UPDATE_GENERATED_IMAGE', payload: { style: originalStyle, image: errorImage } });
            }
        }
        
        dispatch({ type: 'SET_GENERATING_INDEX', payload: null });
        await saveSessionToHistory(state.uploadedImage, finalImages);
        dispatch({ type: 'SET_APP_STATE', payload: 'results-shown' });
    }, [state, credits, iap.isPro, setCredits, addToast, saveSessionToHistory, processImageWithWatermark]);

    const handleRegenerateStyle = useCallback(async (style: string) => {
        if (!state.uploadedImage || state.generatedImages[style]?.status === 'pending') return;
        
        const regenerationCost = 1;
        if (!iap.isPro && credits < regenerationCost) {
            openModal('subscription');
            return;
        }

        if (!iap.isPro) setCredits(prev => prev - regenerationCost);

        let newCaption = style;
        if (style === 'Surprise Me!') {
            newCaption = SURPRISE_STYLES[Math.floor(Math.random() * SURPRISE_STYLES.length)];
        }

        dispatch({ type: 'UPDATE_GENERATED_IMAGE', payload: { style, image: { status: 'pending', caption: newCaption } } });

        try {
            const prompt = `Reimagine the person in this photo in the style of ${newCaption}.`;
            const resultUrl = await generateStyledImage(state.uploadedImage, prompt, newCaption);
            const watermarkedUrl = await processImageWithWatermark(resultUrl);
            dispatch({ type: 'UPDATE_GENERATED_IMAGE', payload: { style, image: { status: 'done', url: watermarkedUrl, caption: newCaption } } });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            dispatch({ type: 'UPDATE_GENERATED_IMAGE', payload: { style, image: { status: 'error', error: errorMessage, caption: newCaption } } });
        }
    }, [state, credits, iap.isPro, setCredits, addToast, processImageWithWatermark]);

    const handleReset = useCallback(() => {
        dispatch({ type: 'RESET_STATE' });
        refreshLatestHistorySession();
    }, [refreshLatestHistorySession]);
    
    const handleRestoreSession = useCallback((session: HistorySession) => {
        dispatch({ type: 'SET_UPLOADED_IMAGE', payload: session.uploadedImage });
        dispatch({ type: 'SET_GENERATED_IMAGES', payload: session.generatedImages });
        dispatch({ type: 'SET_ACTIVE_SESSION_STYLES', payload: Object.keys(session.generatedImages) });
        dispatch({ type: 'SET_ACTIVE_INDEX', payload: 0 });
        dispatch({ type: 'SET_APP_STATE', payload: 'results-shown' });
        dispatch({ type: 'SET_IS_RESTORED_SESSION', payload: true });
        closeModal('history');
    }, []);

    const onSuccessfulPurchase = (sku: string) => {
        if(sku.includes('credits_30')) setCredits(c => c + 30);
        if(sku.includes('credits_100')) setCredits(c => c + 100);
        if(sku.includes('credits_500')) setCredits(c => c + 500);
        closeModal('subscription');
    };

    // --- Shareable Views Logic ---
    const captureAndAct = useCallback(async (action: 'share' | 'download', title: string, message: string) => {
        try {
            const uri = await viewShotRef.current?.capture?.();
            if (uri) {
                if (action === 'share') await shareImage(uri, title, message);
                else {
                    await saveToCameraRoll(uri, 'photo');
                    addToast(`${title} has been saved to your photos.`, 'success');
                }
            }
        } catch (error) {
            addToast(`Could not ${action} the image. Please try again.`, 'error');
        } finally {
            dispatch({ type: 'SET_SHAREABLE_VIEW', payload: null });
        }
    }, [addToast]);

    useEffect(() => {
        if (state.shareableView) {
            setTimeout(() => {
                if (React.isValidElement(state.shareableView)) {
                    const props = state.shareableView.props as { action?: 'share' | 'download', title?: string, message?: string };
                    if (props.action) {
                        captureAndAct(props.action, props.title ?? '', props.message ?? '');
                    }
                }
            }, 100);
        }
    }, [state.shareableView, captureAndAct]);
    
    const handleShareComparison = (originalUrl: string, generatedUrl: string, caption: string) => {
        dispatch({ type: 'SET_SHAREABLE_VIEW', payload: <ComparisonView action="share" title={`My ${caption} Alter Ego!`} message="Check out my before & after generated by AlterEgo AI! #AlterEgoAI" originalImageUrl={originalUrl} generatedImageUrl={generatedUrl} caption={caption} /> });
    };

    const handleDownloadAlbum = () => {
        const imageData = Object.values(state.generatedImages).filter(img => img.status === 'done' && img.url).reduce((acc, img) => ({ ...acc, [img.caption]: img.url! }), {});
        if (Object.keys(imageData).length === 0) return addToast("No successful images to create an album.", 'error');
        dispatch({ type: 'SET_SHAREABLE_VIEW', payload: <AlbumView action="download" title="My AlterEgo Album" message="" imageData={imageData} /> });
    };
    
    const handleShareAlbum = () => {
        const imageData = Object.values(state.generatedImages).filter(img => img.status === 'done' && img.url).reduce((acc, img) => ({ ...acc, [img.caption]: img.url! }), {});
        if (Object.keys(imageData).length === 0) return addToast("No successful images to create an album.", 'error');
        dispatch({ type: 'SET_SHAREABLE_VIEW', payload: <AlbumView action="share" title="My AlterEgo AI Album" message="Check out my album generated by AlterEgo AI! #AlterEgoAI" imageData={imageData} /> });
    };

    const value = {
        state: { ...state, credits, isPro: iap.isPro, favoritedImages, latestHistorySession },
        actions: {
            handleUploadPhoto, handleTakePhoto, handleToggleStyle, handleShuffleStyles, handleGenerateClick, handleRegenerateStyle, handleReset, handleRestoreSession,
            handleShareComparison, handleDownloadAlbum, handleShareAlbum, setActiveIndex, openModal, closeModal, onSuccessfulPurchase, toggleFavorite
        },
        iap,
        ImageProcessorComponent,
        viewShotRef
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
