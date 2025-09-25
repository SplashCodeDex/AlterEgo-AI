/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { createContext, useContext, useReducer, useCallback, useRef, ReactNode, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIAP } from '../hooks/useIAP';
import { useToasts } from '../components/Toaster';
import { generateStyledImage } from '../services/geminiService';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { saveToCameraRoll, shareImage } from '../lib/nativeSharing';
import type { GeneratedImage, HistorySession, FavoritedImage } from '../types';
import { DEFAULT_STYLES, ALL_STYLES, SURPRISE_STYLES, Style, IAP_SKUS } from '../constants';
import ComparisonView from '../components/shareables/ComparisonView';
import AlbumView from '../components/shareables/AlbumView';
import ViewShot from 'react-native-view-shot';

// --- STATE AND REDUCER ---

interface AppState {
    hydrated: boolean;
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
    history: HistorySession[];
    latestHistorySession: HistorySession | null;
}

type AppAction =
    | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
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
    | { type: 'ADD_CREDITS'; payload: number }
    | { type: 'SET_CREDITS'; payload: number }
    | { type: 'SET_IS_PRO'; payload: boolean }
    | { type: 'TOGGLE_FAVORITE'; payload: { url: string; caption: string; originalUrl: string } }
    | { type: 'SAVE_SESSION_TO_HISTORY'; payload: HistorySession }
    | { type: 'CLEAR_HISTORY' }
    | { type: 'RESET_SESSION' };

const initialState: AppState = {
    hydrated: false,
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
    history: [],
    latestHistorySession: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'HYDRATE_STATE': {
            const history = action.payload.history || [];
            return { ...state, ...action.payload, hydrated: true, latestHistorySession: history.length > 0 ? history[0] : null };
        }
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
        case 'TOGGLE_SELECTED_STYLE': {
            const newSet = new Set(state.selectedStyles);
            if (newSet.has(action.payload)) newSet.delete(action.payload);
            else newSet.add(action.payload);
            return { ...state, selectedStyles: newSet };
        }
        case 'SET_SELECTED_STYLES':
            return { ...state, selectedStyles: action.payload };
        case 'SET_SHAREABLE_VIEW':
            return { ...state, shareableView: action.payload };
        case 'ADD_CREDITS':
            return { ...state, credits: state.credits + action.payload };
        case 'SET_CREDITS':
             return { ...state, credits: action.payload };
        case 'SET_IS_PRO':
            return { ...state, isPro: action.payload };
        case 'TOGGLE_FAVORITE': {
            const { url, caption, originalUrl } = action.payload;
            const newFavorites = { ...state.favoritedImages };
            if (newFavorites[url]) delete newFavorites[url];
            else newFavorites[url] = { url, caption, originalUrl };
            return { ...state, favoritedImages: newFavorites };
        }
        case 'SAVE_SESSION_TO_HISTORY': {
            const newHistory = [action.payload, ...state.history].slice(0, 5);
            return { ...state, history: newHistory, latestHistorySession: newHistory[0] };
        }
        case 'CLEAR_HISTORY':
            return { ...state, history: [], latestHistorySession: null };
        case 'RESET_SESSION':
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

// --- ACTIONS FACTORY ---

// This factory function encapsulates all business logic and side effects,
// keeping the AppProvider component clean and focused on state management.
const createActions = (
    dispatch: React.Dispatch<AppAction>, 
    state: AppState,
    addToast: (message: string, type?: 'success' | 'error', icon?: ReactNode) => void,
    viewShotRef: React.RefObject<ViewShot>,
    cancelGenerationRef: React.MutableRefObject<boolean>
) => {
    const openModal = (modal: 'subscription' | 'history' | 'favorites') => dispatch({ type: 'SET_MODAL_VISIBILITY', payload: { modal, visible: true } });
    const closeModal = (modal: 'subscription' | 'history' | 'favorites') => dispatch({ type: 'SET_MODAL_VISIBILITY', payload: { modal, visible: false } });

    const handleImageResponse = (response: ImagePickerResponse) => {
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
    };

    const handleGenerateClick = async () => {
        if (!state.uploadedImage || state.selectedStyles.size === 0) return;
        
        cancelGenerationRef.current = false;
        const generationCost = state.selectedStyles.size;
        if (!state.isPro && state.credits < generationCost) {
            openModal('subscription');
            return;
        }

        if (!state.isPro) dispatch({ type: 'SET_CREDITS', payload: state.credits - generationCost });
        
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
            if (cancelGenerationRef.current) break;
            dispatch({ type: 'SET_GENERATING_INDEX', payload: i });
            const { originalStyle, caption } = generationQueue[i];
            
            try {
                const prompt = `Reimagine the person in this photo in the style of ${caption}.`;
                const resultUrl = await generateStyledImage(state.uploadedImage, prompt, caption);
                const newImage: GeneratedImage = { caption, status: 'done', url: resultUrl };
                finalImages = { ...finalImages, [originalStyle]: newImage };
                dispatch({ type: 'UPDATE_GENERATED_IMAGE', payload: { style: originalStyle, image: newImage } });
            } catch (err) {
                 const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                 const errorImage: GeneratedImage = { caption, status: 'error', error: errorMessage };
                 finalImages = { ...finalImages, [originalStyle]: errorImage };
                 dispatch({ type: 'UPDATE_GENERATED_IMAGE', payload: { style: originalStyle, image: errorImage } });
                 addToast(`Failed to generate: ${caption}`, 'error');
            }
        }
        
        dispatch({ type: 'SET_GENERATING_INDEX', payload: null });
        if (!cancelGenerationRef.current) {
            const session: HistorySession = { uploadedImage: state.uploadedImage, generatedImages: finalImages, timestamp: Date.now() };
            dispatch({ type: 'SAVE_SESSION_TO_HISTORY', payload: session });
            dispatch({ type: 'SET_APP_STATE', payload: 'results-shown' });
        }
    };

    const captureAndAct = async (view: ReactNode, action: 'share' | 'download', title: string, message: string) => {
        dispatch({ type: 'SET_SHAREABLE_VIEW', payload: view });
        await new Promise(res => setTimeout(res, 100)); // Allow view to render
        try {
            const uri = await viewShotRef.current?.capture?.();
            if (uri) {
                if (action === 'share') await shareImage(uri, title, message);
                else {
                    await saveToCameraRoll(uri, 'photo');
                    addToast(`${title} has been saved.`, 'success');
                }
            }
        } catch (error) {
            addToast(`Could not ${action} image.`, 'error');
        } finally {
            dispatch({ type: 'SET_SHAREABLE_VIEW', payload: null });
        }
    };
    
    return {
        handleUploadPhoto: () => launchImageLibrary({ mediaType: 'photo', quality: 0.8, includeBase64: true }, handleImageResponse),
        handleTakePhoto: () => launchCamera({ mediaType: 'photo', quality: 0.8, cameraType: 'front', includeBase64: true }, handleImageResponse),
        handleToggleStyle: (caption: string) => dispatch({ type: 'TOGGLE_SELECTED_STYLE', payload: caption }),
        handleShuffleStyles: () => {
            const remainingStyles = ALL_STYLES.filter(style => !state.currentStyles.some(cs => cs.caption === style.caption));
            const shuffled = [...remainingStyles].sort(() => 0.5 - Math.random());
            const surpriseStyle = ALL_STYLES.find(s => s.caption === 'Surprise Me!') ?? DEFAULT_STYLES.find(s => s.caption === 'Surprise Me!')!;
            const newStyles = [...shuffled.slice(0, 5), surpriseStyle];
            dispatch({ type: 'SET_CURRENT_STYLES', payload: newStyles.sort(() => (Math.random() > .5) ? 1 : -1) });
            dispatch({ type: 'SET_SELECTED_STYLES', payload: new Set(newStyles.map(s => s.caption)) });
        },
        handleGenerateClick,
        handleCancelGeneration: () => {
            cancelGenerationRef.current = true;
            dispatch({ type: 'SET_APP_STATE', payload: 'image-uploaded' });
            if (!state.isPro) {
                const refundAmount = state.activeSessionStyles.length;
                dispatch({ type: 'ADD_CREDITS', payload: refundAmount });
                addToast(`Generation cancelled. ${refundAmount} credits refunded.`, "success");
            } else {
                addToast("Generation cancelled.", "success");
            }
        },
        handleRegenerateStyle: async (style: string) => {
            if (!state.uploadedImage || state.generatedImages[style]?.status === 'pending') return;
            if (!state.isPro && state.credits < 1) { openModal('subscription'); return; }
            if (!state.isPro) dispatch({ type: 'SET_CREDITS', payload: state.credits - 1 });

            let newCaption = style;
            if (style === 'Surprise Me!') newCaption = SURPRISE_STYLES[Math.floor(Math.random() * SURPRISE_STYLES.length)];
            dispatch({ type: 'UPDATE_GENERATED_IMAGE', payload: { style, image: { status: 'pending', caption: newCaption } } });

            try {
                const resultUrl = await generateStyledImage(state.uploadedImage, `Reimagine the person in this photo in the style of ${newCaption}.`, newCaption);
                dispatch({ type: 'UPDATE_GENERATED_IMAGE', payload: { style, image: { status: 'done', url: resultUrl, caption: newCaption } } });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                dispatch({ type: 'UPDATE_GENERATED_IMAGE', payload: { style, image: { status: 'error', error: errorMessage, caption: newCaption } } });
                addToast(`Failed to regenerate: ${newCaption}`, 'error');
            }
        },
        handleReset: () => dispatch({ type: 'RESET_SESSION' }),
        handleRestoreSession: (session: HistorySession) => {
            dispatch({ type: 'SET_UPLOADED_IMAGE', payload: session.uploadedImage });
            dispatch({ type: 'SET_GENERATED_IMAGES', payload: session.generatedImages });
            dispatch({ type: 'SET_ACTIVE_SESSION_STYLES', payload: Object.keys(session.generatedImages) });
            dispatch({ type: 'SET_ACTIVE_INDEX', payload: 0 });
            dispatch({ type: 'SET_APP_STATE', payload: 'results-shown' });
            dispatch({ type: 'SET_IS_RESTORED_SESSION', payload: true });
            closeModal('history');
        },
        handleShareComparison: (originalUrl: string, generatedUrl: string, caption: string) => {
            const view = <ComparisonView originalImageUrl={originalUrl} generatedImageUrl={generatedUrl} caption={caption} />;
            captureAndAct(view, 'share', `My ${caption} Alter Ego!`, "Generated by AlterEgo AI!");
        },
        handleDownloadAlbum: () => {
            const imageData = Object.values(state.generatedImages).filter(img => img.status === 'done' && img.url).reduce((acc, img) => ({ ...acc, [img.caption]: img.url! }), {});
            if (Object.keys(imageData).length === 0) return addToast("No images to create album.", 'error');
            const view = <AlbumView imageData={imageData} />;
            captureAndAct(view, 'download', 'AlterEgo Album', '');
        },
        handleShareAlbum: () => {
            const imageData = Object.values(state.generatedImages).filter(img => img.status === 'done' && img.url).reduce((acc, img) => ({ ...acc, [img.caption]: img.url! }), {});
            if (Object.keys(imageData).length === 0) return addToast("No images to create album.", 'error');
            const view = <AlbumView imageData={imageData} />;
            captureAndAct(view, 'share', 'My AlterEgo AI Album', 'Check out my album!');
        },
        setActiveIndex: (index: number) => dispatch({ type: 'SET_ACTIVE_INDEX', payload: index }),
        openModal,
        closeModal,
        toggleFavorite: (url: string, caption: string, originalUrl: string) => dispatch({ type: 'TOGGLE_FAVORITE', payload: { url, caption, originalUrl } }),
        handleClearHistory: () => dispatch({ type: 'CLEAR_HISTORY' }),
        handleSaveToCameraRoll: (uri: string) => saveToCameraRoll(uri, 'photo'),
        handleShareImage: shareImage,
    };
};

// --- CONTEXT AND PROVIDER ---

interface AppContextType {
    state: AppState;
    actions: ReturnType<typeof createActions>;
    iap: ReturnType<typeof useIAP>;
    ImageProcessorComponent: JSX.Element | null;
    viewShotRef: React.RefObject<ViewShot>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children, onReady }: { children: ReactNode; onReady: () => void; }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const cancelGenerationRef = useRef(false);
    const { addToast } = useToasts();
    const viewShotRef = useRef<ViewShot>(null);

    // --- CHILD HOOKS ---
    const onPurchaseVerified = useCallback((sku: string) => {
        let creditsToAdd = 0;
        if (sku === IAP_SKUS.credits_30) creditsToAdd = 30;
        if (sku === IAP_SKUS.credits_100) creditsToAdd = 100;
        if (sku === IAP_SKUS.credits_500) creditsToAdd = 500;
        
        if (creditsToAdd > 0) {
            dispatch({ type: 'ADD_CREDITS', payload: creditsToAdd });
            addToast(`${creditsToAdd} credits added!`, 'success');
        }
        if (sku === IAP_SKUS.pro_monthly) {
            addToast('Welcome to PRO!', 'success');
        }
        dispatch({ type: 'SET_MODAL_VISIBILITY', payload: { modal: 'subscription', visible: false } });
    }, [addToast]);
    
    const iap = useIAP(onPurchaseVerified);

    // --- SIDE EFFECTS (HYDRATION & PERSISTENCE) ---
    useEffect(() => {
        const hydrate = async () => {
            try {
                const creditsStr = await AsyncStorage.getItem('alterEgoCredits');
                const favoritesStr = await AsyncStorage.getItem('alterEgoFavorites');
                const historyStr = await AsyncStorage.getItem('alterEgoHistory');
                const payload: Partial<AppState> = {
                    credits: creditsStr ? JSON.parse(creditsStr) : 18,
                    favoritedImages: favoritesStr ? JSON.parse(favoritesStr) : {},
                    history: historyStr ? JSON.parse(historyStr) : [],
                };
                dispatch({ type: 'HYDRATE_STATE', payload });
            } catch (e) {
                console.error("Failed to hydrate state from AsyncStorage", e);
                dispatch({ type: 'HYDRATE_STATE', payload: {} });
            } finally {
                onReady();
            }
        };
        hydrate();
    }, [onReady]);
    
    useEffect(() => {
        if (state.hydrated) {
            AsyncStorage.setItem('alterEgoCredits', JSON.stringify(state.credits));
            AsyncStorage.setItem('alterEgoFavorites', JSON.stringify(state.favoritedImages));
            AsyncStorage.setItem('alterEgoHistory', JSON.stringify(state.history));
        }
    }, [state.credits, state.favoritedImages, state.history, state.hydrated]);
    
    useEffect(() => {
        dispatch({ type: 'SET_IS_PRO', payload: iap.isPro });
    }, [iap.isPro]);

    // Memoize the actions object so it doesn't get recreated on every render
    const actions = useMemo(() => createActions(dispatch, state, addToast, viewShotRef, cancelGenerationRef), [state, addToast]);

    const value = {
        state,
        actions,
        iap,
        ImageProcessorComponent: null,
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