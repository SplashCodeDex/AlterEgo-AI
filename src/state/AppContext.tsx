/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { createContext, useContext, useReducer, useEffect, useCallback, ChangeEvent, useRef } from 'react';
import { useToasts } from '../components/Toaster';
import { useLocalStorageState, useFavorites, useHistory } from '../lib/hooks';
import type { GeneratedImage, HistorySession } from '../types';
import { generateStyledImage } from '../services/geminiService';
import { createAlbumPage, createComparisonImage } from '../lib/albumUtils';
import JSZip from 'jszip';
import { ALL_STYLES, DEFAULT_STYLES, SURPRISE_STYLES, Style } from '../constants';
import { PartyPopper } from 'lucide-react';

interface AppState {
    uploadedImage: string | null;
    generatedImages: Record<string, GeneratedImage>;
    isDownloading: boolean;
    isZipping: boolean;
    isSharing: boolean;
    appState: 'idle' | 'image-uploaded' | 'generating' | 'results-shown';
    isGetCreditsModalOpen: boolean;
    appLoaded: boolean;
    activeIndex: number;
    generatingIndex: number | null;
    isCameraOpen: boolean;
    isFavoritesModalOpen: boolean;
    isHistoryModalOpen: boolean;
    currentStyles: Style[];
    isRestoredSession: boolean;
    selectedStyles: Set<string>;
    infoStyle: Style | null;
    activeSessionStyles: Style[];
    credits: number;
    isPro: boolean;
    favoritedImages: Record<string, any>;
    latestHistorySession: HistorySession | null;
}

// In a larger app, actions would be in their own file.
type Action =
  | { type: 'SET_STATE'; payload: Partial<AppState> }
  | { type: 'SET_GENERATED_IMAGES'; payload: Record<string, GeneratedImage> }
  | { type: 'SET_SELECTED_STYLES'; payload: Set<string> };

const initialState: AppState = {
    uploadedImage: null,
    generatedImages: {},
    isDownloading: false,
    isZipping: false,
    isSharing: false,
    appState: 'idle',
    isGetCreditsModalOpen: false,
    appLoaded: false,
    activeIndex: 0,
    generatingIndex: null,
    isCameraOpen: false,
    isFavoritesModalOpen: false,
    isHistoryModalOpen: false,
    currentStyles: DEFAULT_STYLES,
    isRestoredSession: false,
    selectedStyles: new Set(DEFAULT_STYLES.map(s => s.caption)),
    infoStyle: null,
    activeSessionStyles: [],
    credits: 0, // Will be hydrated from storage
    isPro: false, // Will be hydrated from storage
    favoritedImages: {}, // Will be hydrated from storage
    latestHistorySession: null, // Will be hydrated from storage
};

const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_STATE':
            return { ...state, ...action.payload };
        case 'SET_GENERATED_IMAGES':
            return { ...state, generatedImages: action.payload };
        case 'SET_SELECTED_STYLES':
            return { ...state, selectedStyles: action.payload };
        default:
            return state;
    }
};

const AppContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
    actions: any;
} | undefined>(undefined);


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const cancelGenerationRef = useRef(false);
    const { addToast } = useToasts();
    
    // Hydrate persistent state from local/session storage
    const [credits, setCredits] = useLocalStorageState('alterEgoCredits', 18);
    const [isPro, setIsPro] = useLocalStorageState('alterEgoIsPro', false);
    const { favoritedImages, toggleFavorite } = useFavorites();
    const { latestHistorySession, saveSessionToHistory, refreshLatestHistorySession } = useHistory();

    useEffect(() => {
        dispatch({ type: 'SET_STATE', payload: { credits, isPro, favoritedImages, latestHistorySession } });
    }, [credits, isPro, favoritedImages, latestHistorySession]);


    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch({ type: 'SET_STATE', payload: { appLoaded: true } });
        }, 2000);
        return () => clearTimeout(timer);
    }, []);
    
    useEffect(() => {
        if (state.appLoaded) {
            const hasBeenWelcomed = localStorage.getItem('alterEgoHasWelcomed');
            if (!hasBeenWelcomed) {
                setTimeout(() => {
                    addToast("Welcome! You've got 18 free credits to start.", 'success', <PartyPopper className="text-yellow-500 mr-3" />);
                }, 1000);
                localStorage.setItem('alterEgoHasWelcomed', 'true');
            }
        }
    }, [state.appLoaded, addToast]);

    // Effect to save session when results are shown
    useEffect(() => {
        const saveCurrentSession = async () => {
            if (state.appState === 'results-shown' && !state.isRestoredSession && state.uploadedImage && Object.values(state.generatedImages).length > 0 && Object.values(state.generatedImages).every((img: GeneratedImage) => img.status !== 'pending')) {
                await saveSessionToHistory(state.uploadedImage, state.generatedImages);
            }
        };
        saveCurrentSession();
    }, [state.appState, state.generatedImages, state.uploadedImage, state.isRestoredSession, saveSessionToHistory]);

    // All actions and handlers previously in App.tsx
    const setState = (payload: Partial<AppState>) => dispatch({ type: 'SET_STATE', payload });

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setState({
                    uploadedImage: reader.result as string,
                    appState: 'image-uploaded',
                    generatedImages: {},
                    activeIndex: 0,
                    currentStyles: DEFAULT_STYLES,
                    selectedStyles: new Set(DEFAULT_STYLES.map(s => s.caption)),
                    isRestoredSession: false,
                });
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handlePhotoTaken = (imageDataUrl: string) => {
        setState({
            uploadedImage: imageDataUrl,
            appState: 'image-uploaded',
            generatedImages: {},
            activeIndex: 0,
            currentStyles: DEFAULT_STYLES,
            selectedStyles: new Set(DEFAULT_STYLES.map(s => s.caption)),
            isCameraOpen: false,
            isRestoredSession: false,
        });
    };
    
    const handleShuffleStyles = () => {
        const remainingStyles = ALL_STYLES.filter(style => !state.currentStyles.some(cs => cs.caption === style.caption));
        const shuffled = [...remainingStyles].sort(() => 0.5 - Math.random());
        const surpriseStyle = ALL_STYLES.find(s => s.caption === 'Surprise Me!') ?? DEFAULT_STYLES.find(s => s.caption === 'Surprise Me!')!;
        const newStyles = [...shuffled.slice(0, 5), surpriseStyle];
        setState({
            currentStyles: newStyles.sort(() => (Math.random() > .5) ? 1 : -1),
            selectedStyles: new Set(newStyles.map(s => s.caption))
        });
    };
    
    const handleToggleStyle = (caption: string) => {
        dispatch({
            type: 'SET_SELECTED_STYLES',
            payload: new Set(state.selectedStyles.has(caption) ? [...state.selectedStyles].filter(c => c !== caption) : [...state.selectedStyles, caption])
        });
    };

    const handleGenerateClick = async () => {
        if (!state.uploadedImage || state.selectedStyles.size === 0) return;

        cancelGenerationRef.current = false;
        const generationCost = state.selectedStyles.size;

        if (!isPro && credits < generationCost) {
            addToast(`You need ${generationCost} credits, but you only have ${credits}.`, 'error');
            setState({ isGetCreditsModalOpen: true });
            return;
        }

        if (!isPro) setCredits(prev => prev - generationCost);
        
        const stylesToGenerate = state.currentStyles.filter(style => state.selectedStyles.has(style.caption));
        
        setState({ appState: 'generating', isRestoredSession: false, activeSessionStyles: stylesToGenerate });

        const initialImages: Record<string, GeneratedImage> = {};
        const generationQueue = stylesToGenerate.map(style => {
             let caption = style.caption;
            if (style.caption === 'Surprise Me!') {
                caption = SURPRISE_STYLES[Math.floor(Math.random() * SURPRISE_STYLES.length)];
            }
            initialImages[style.caption] = { status: 'pending', caption };
            return { originalStyle: style.caption, caption: initialImages[style.caption].caption };
        });
        
        dispatch({ type: 'SET_GENERATED_IMAGES', payload: initialImages });

        for (let i = 0; i < generationQueue.length; i++) {
            if (cancelGenerationRef.current) break;
            setState({ generatingIndex: i });
            const { originalStyle, caption } = generationQueue[i];
            
            try {
                const prompt = `Reimagine the person in this photo in the style of ${caption}. This includes clothing, hairstyle, photo quality, and the overall aesthetic of that style. The output must be a photorealistic image showing the person clearly.`;
                const resultUrl = await generateStyledImage(state.uploadedImage, prompt, caption);
                dispatch({
                    type: 'SET_GENERATED_IMAGES',
                    payload: { ...state.generatedImages, [originalStyle]: { ...state.generatedImages[originalStyle], status: 'done', url: resultUrl } }
                });
            } catch (err) {
                 const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                 dispatch({
                    type: 'SET_GENERATED_IMAGES',
                    payload: { ...state.generatedImages, [originalStyle]: { ...state.generatedImages[originalStyle], status: 'error', error: errorMessage } }
                });
                console.error(`Failed to generate image for ${originalStyle}:`, err);
            }
        }
        
        setState({ generatingIndex: null });
        if (!cancelGenerationRef.current) setState({ appState: 'results-shown' });
    };

    const handleCancelGeneration = () => {
        cancelGenerationRef.current = true;
        setState({ appState: 'image-uploaded' });
        if (!isPro) setCredits(prev => prev + state.activeSessionStyles.length);
        addToast("Generation cancelled. Credits refunded.", "success");
    };

    const handleRegenerateStyle = async (style: string) => {
        if (!state.uploadedImage || state.generatedImages[style]?.status === 'pending') return;
        
        if (!isPro && credits < 1) {
            setState({ isGetCreditsModalOpen: true });
            return;
        }
        if (!isPro) setCredits(prev => prev - 1);

        let newCaption = style;
        if (style === 'Surprise Me!') {
            newCaption = SURPRISE_STYLES[Math.floor(Math.random() * SURPRISE_STYLES.length)];
        }

        dispatch({ type: 'SET_GENERATED_IMAGES', payload: { ...state.generatedImages, [style]: { status: 'pending', caption: newCaption } } });

        try {
            const prompt = `Reimagine the person in this photo in the style of ${newCaption}.`;
            const resultUrl = await generateStyledImage(state.uploadedImage, prompt, newCaption);
            dispatch({ type: 'SET_GENERATED_IMAGES', payload: { ...state.generatedImages, [style]: { ...state.generatedImages[style], status: 'done', url: resultUrl } } });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            dispatch({ type: 'SET_GENERATED_IMAGES', payload: { ...state.generatedImages, [style]: { ...state.generatedImages[style], status: 'error', error: errorMessage } } });
        }
    };
    
    const handleReset = useCallback(() => {
        setState({
            uploadedImage: null,
            generatedImages: {},
            appState: 'idle',
            activeIndex: 0,
            isRestoredSession: false,
            currentStyles: DEFAULT_STYLES,
            activeSessionStyles: [],
        });
        refreshLatestHistorySession();
    }, [refreshLatestHistorySession]);
    
    const handleRestoreSession = useCallback((session: HistorySession) => {
        const restoredStyles = Object.keys(session.generatedImages).map(caption => {
            return ALL_STYLES.find(s => s.caption === caption) || DEFAULT_STYLES.find(s => s.caption === caption) || { caption, description: 'A restored style.' };
        });
        setState({
            uploadedImage: session.uploadedImage,
            generatedImages: session.generatedImages,
            activeSessionStyles: restoredStyles,
            activeIndex: 0,
            appState: 'results-shown',
            isHistoryModalOpen: false,
            isRestoredSession: true,
        });
    }, []);

    const handleDownloadFromUrl = (url: string, caption: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `alterego-${caption.toLowerCase().replace(/\s/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadIndividualImage = (style: string) => {
        const image = state.generatedImages[style];
        if (image?.status === 'done' && image.url) {
            handleDownloadFromUrl(image.url, image.caption);
        }
    };
    
    const handleShare = async (dataUrl: string, title: string, text: string, filename: string) => {
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], filename, { type: blob.type });
            const shareData = { files: [file], title, text };

            if (navigator.share && navigator.canShare?.(shareData)) {
                await navigator.share(shareData);
            } else {
                 addToast('Sharing not supported on this browser.', 'error');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleShareIndividualImage = (style: string) => {
        const image = state.generatedImages[style];
        if (image?.status === 'done' && image.url) {
            const shareCaption = style === 'Surprise Me!' ? image.caption : style;
            handleShare(
                image.url,
                `My ${shareCaption} Look!`,
                `Check out my ${shareCaption} photo generated by AlterEgo AI! #AlterEgoAI`,
                `alterego-${shareCaption.toLowerCase().replace(/\s/g, '-')}.png`
            );
        }
    };

    const handleDownloadAlbum = async () => {
        setState({ isDownloading: true });
        try {
            const imageData = Object.values(state.generatedImages).filter(img => img.status === 'done').reduce((acc, img) => ({ ...acc, [img.caption]: img.url! }), {});
            if (Object.keys(imageData).length === 0) return;
            const albumDataUrl = await createAlbumPage(imageData);
            handleDownloadFromUrl(albumDataUrl, 'alterego-album');
        } finally {
            setState({ isDownloading: false });
        }
    };

    const handleDownloadZip = async () => {
        setState({ isZipping: true });
        try {
            const zip = new JSZip();
            Object.values(state.generatedImages).filter(img => img.status === 'done').forEach(img => {
                zip.file(`alterego-${img.caption.toLowerCase().replace(/\s/g, '-')}.png`, img.url!.split(',')[1], { base64: true });
            });
            const content = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'alterego-images.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            setState({ isZipping: false });
        }
    };

    const handleShareAlbum = async () => {
        setState({ isSharing: true });
        try {
            const imageData = Object.values(state.generatedImages).filter(img => img.status === 'done').reduce((acc, img) => ({ ...acc, [img.caption]: img.url! }), {});
            if (Object.keys(imageData).length === 0) return;
            const albumDataUrl = await createAlbumPage(imageData);
            await handleShare(albumDataUrl, 'My AlterEgo AI Album', 'Check out my album!', 'alterego-album.jpg');
        } finally {
            setState({ isSharing: false });
        }
    };
    
    const handleShareComparison = async (originalUrl: string, generatedUrl: string, caption: string) => {
        setState({ isSharing: true });
        try {
            const comparisonDataUrl = await createComparisonImage(originalUrl, generatedUrl, caption);
            await handleShare(comparisonDataUrl, `My ${caption} Alter Ego!`, 'Check out my before & after!', `alterego-comparison.jpg`);
        } finally {
            setState({ isSharing: false });
        }
    };

    const actions = {
        handleImageUpload, handlePhotoTaken, handleShuffleStyles, handleToggleStyle, handleGenerateClick,
        handleCancelGeneration, handleRegenerateStyle, handleReset, handleRestoreSession,
        handleDownloadFromUrl, handleDownloadIndividualImage, handleShare, handleShareIndividualImage,
        handleDownloadAlbum, handleDownloadZip, handleShareAlbum, handleShareComparison,
        setInfoStyle: (infoStyle: Style | null) => setState({ infoStyle }),
        setIsGetCreditsModalOpen: (isOpen: boolean) => setState({ isGetCreditsModalOpen: isOpen }),
        setIsCameraOpen: (isOpen: boolean) => setState({ isCameraOpen: isOpen }),
        setIsFavoritesModalOpen: (isOpen: boolean) => setState({ isFavoritesModalOpen: isOpen }),
        setIsHistoryModalOpen: (isOpen: boolean) => setState({ isHistoryModalOpen: isOpen }),
        setActiveIndex: (index: number) => setState({ activeIndex: index }),
        toggleFavorite,
        setCredits,
        setIsPro,
    };

    return (
        <AppContext.Provider value={{ state, dispatch, actions }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
