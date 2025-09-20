/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, ChangeEvent, useRef, lazy, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStyledImage } from './services/geminiService';
import PhotoCard from './components/PhotoCard';
import { createAlbumPage, createComparisonImage } from './lib/albumUtils';
import Header from './components/Header';
import { FileImage, Sparkles, X, Infinity, Palette, Gift, Camera, PartyPopper, History, Dices, Info, CheckCircle } from 'lucide-react';
import JSZip from 'jszip';
import SplashScreen from './components/SplashScreen';
import Logo from './components/Logo';
import { useToasts } from './components/Toaster';
import GeneratingView from './components/GeneratingView';
// @ts-ignore
import { useLocalStorageState, useFavorites, useHistory } from './lib/hooks';
import type { GeneratedImage, HistorySession } from './types';

// Lazy load heavy components
const GetCreditsModal = lazy(() => import('./components/GetCreditsModal'));
const CameraView = lazy(() => import('./components/CameraView'));
const FavoritesModal = lazy(() => import('./components/FavoritesModal'));
const HistoryModal = lazy(() => import('./components/HistoryModal'));


interface Style {
    caption: string;
    description: string;
}

const ALL_STYLES: Style[] = [
    { caption: '1950s Film Noir', description: 'Classic black & white with dramatic shadows and a mysterious mood.' },
    { caption: '1970s Disco', description: 'Vibrant, flashy, and ready for a night at the disco club.' },
    { caption: '1990s Grunge', description: 'An edgy, alternative look with flannel, faded tones, and raw attitude.' },
    { caption: 'Victorian Daguerreotype', description: 'A haunting, early-photography style with sepia tones and a formal pose.' },
    { caption: 'Futuristic Neon', description: 'Bathed in the glowing lights of a high-tech, Blade Runner-esque city.' },
    { caption: 'Renaissance Portrait', description: 'Become a timeless masterpiece in the style of the old masters.' },
    { caption: 'Ancient Greek Sculpture', description: 'Chiselled from marble, a classic and heroic transformation.' },
    { caption: 'Art Deco Poster', description: 'Bold lines, geometric shapes, and the glamour of the Roaring Twenties.' },
    { caption: 'Cyberpunk Hero', description: 'A high-tech rebel in a dystopian, neon-lit metropolis.' },
    { caption: 'Steampunk Inventor', description: 'An adventurer from an age of steam power and intricate clockwork.' },
    { caption: 'Fantasy Elf', description: 'An elegant and ethereal being from a realm of ancient magic.' },
    { caption: 'Pop Art Comic', description: 'Bold dots, vibrant colors, and the action-packed style of a comic book.' },
    { caption: 'Vaporwave Glitch', description: 'A retro-futuristic aesthetic with glitched visuals and pastel tones.' },
    { caption: 'Gothic Painting', description: 'A dark, dramatic, and romantic style with a touch of melancholy.' },
    { caption: 'Impressionist Artwork', description: 'Soft, dreamy brushstrokes that capture the fleeting quality of light.' },
    { caption: 'Surrealist Dreamscape', description: 'A bizarre, fantastical, and mind-bending journey into the subconscious.' },
    { caption: 'Tribal Warrior', description: 'Adorned with intricate patterns and the fierce spirit of a warrior.' },
    { caption: 'Wasteland Survivor', description: 'A rugged hero navigating a gritty, post-apocalyptic world.' },
    { caption: 'Minimalist Ink Wash', description: 'A simple, elegant, and expressive style inspired by traditional calligraphy.' },
    { caption: 'Psychedelic 60s Poster', description: 'Swirling patterns, vibrant colors, and the free-spirited vibe of the Summer of Love.' },
    { caption: 'Ancient Egyptian Papyrus', description: 'Transformed into a figure from the time of pharaohs and pyramids.' },
    { caption: 'Art Nouveau Illustration', description: 'Elegant, flowing lines and ornate details inspired by nature.' }
];

const DEFAULT_STYLES: Style[] = [
    { caption: '1950s', description: 'A dramatic, black and white Film Noir look with sharp shadows.' },
    { caption: '1970s', description: 'Get ready for the disco floor with vibrant colors and a groovy vibe.' },
    { caption: '1990s', description: 'Embrace the alternative scene with a moody, grunge-inspired aesthetic.' },
    { caption: 'Victorian', description: 'A formal, sepia-toned portrait from the age of invention.' },
    { caption: 'Future', description: 'Step into a neon-lit, high-tech city of tomorrow.' },
    { caption: 'Surprise Me!', description: 'A random portal to an unknown style. What will you become?' }
];

const SURPRISE_STYLES = ['1920s Art Deco', '1960s Psychedelic', 'Cyberpunk', 'Steampunk', 'Fantasy Portrait', 'Pop Art', 'Anime', 'Vaporwave'];


const primaryButtonClasses = "font-inter font-bold text-base sm:text-lg text-center text-white bg-blue-600 py-2.5 px-6 sm:py-3 sm:px-8 rounded-full transform transition-all duration-300 hover:scale-105 hover:bg-blue-500 shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-blue-600";
const secondaryButtonClasses = "font-inter font-bold text-base sm:text-lg text-center text-neutral-300 bg-white/5 backdrop-blur-sm border border-white/20 py-2.5 px-6 sm:py-3 sm:px-8 rounded-full transform transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:text-white flex items-center gap-2";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } },
};


function App() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [isZipping, setIsZipping] = useState<boolean>(false);
    const [isSharing, setIsSharing] = useState<boolean>(false);
    const [appState, setAppState] = useState<'idle' | 'image-uploaded' | 'generating' | 'results-shown'>('idle');
    const [isGetCreditsModalOpen, setIsGetCreditsModalOpen] = useState(false);
    const [appLoaded, setAppLoaded] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
    const cancelGenerationRef = useRef(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const { addToast } = useToasts();
    const [currentStyles, setCurrentStyles] = useState<Style[]>(DEFAULT_STYLES);
    const [isRestoredSession, setIsRestoredSession] = useState(false);
    const [selectedStyles, setSelectedStyles] = useState<Set<string>>(new Set(DEFAULT_STYLES.map(s => s.caption)));
    const [infoStyle, setInfoStyle] = useState<Style | null>(null);
    const [activeSessionStyles, setActiveSessionStyles] = useState<Style[]>([]);

    const [credits, setCredits] = useLocalStorageState('alterEgoCredits', 18);
    const [isPro, setIsPro] = useLocalStorageState('alterEgoIsPro', false);
    const { favoritedImages, toggleFavorite } = useFavorites();
    const { latestHistorySession, saveSessionToHistory, refreshLatestHistorySession } = useHistory();

    useEffect(() => {
        const timer = setTimeout(() => {
            setAppLoaded(true);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);
    
    useEffect(() => {
        if (appLoaded) {
            const hasBeenWelcomed = localStorage.getItem('alterEgoHasWelcomed');
            if (!hasBeenWelcomed) {
                setTimeout(() => {
                    addToast("Welcome! You've got 18 free credits to start.", 'success', <PartyPopper className="text-yellow-500 mr-3" />);
                }, 1000); // delay after splash screen
                localStorage.setItem('alterEgoHasWelcomed', 'true');
            }
        }
    }, [appLoaded, addToast]);

    // Effect to save session when results are shown
    useEffect(() => {
        const saveCurrentSession = async () => {
            if (appState === 'results-shown' && !isRestoredSession && uploadedImage && Object.values(generatedImages).every((img: GeneratedImage) => img.status !== 'pending')) {
                await saveSessionToHistory(uploadedImage, generatedImages);
            }
        };
        saveCurrentSession();
    }, [appState, generatedImages, uploadedImage, isRestoredSession, saveSessionToHistory]);


    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setAppState('image-uploaded');
                setGeneratedImages({});
                setActiveIndex(0);
                setCurrentStyles(DEFAULT_STYLES);
                setSelectedStyles(new Set(DEFAULT_STYLES.map(s => s.caption)));
                setIsRestoredSession(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePhotoTaken = (imageDataUrl: string) => {
        setUploadedImage(imageDataUrl);
        setAppState('image-uploaded');
        setGeneratedImages({});
        setActiveIndex(0);
        setCurrentStyles(DEFAULT_STYLES);
        setSelectedStyles(new Set(DEFAULT_STYLES.map(s => s.caption)));
        setIsCameraOpen(false);
        setIsRestoredSession(false);
    };
    
    const handleShuffleStyles = () => {
        const remainingStyles = ALL_STYLES.filter(style => !currentStyles.some(cs => cs.caption === style.caption));
        const shuffled = [...remainingStyles].sort(() => 0.5 - Math.random());
        
        const surpriseStyle = ALL_STYLES.find(s => s.caption === 'Surprise Me!') ?? DEFAULT_STYLES.find(s => s.caption === 'Surprise Me!')!;
        const newStyles = [...shuffled.slice(0, 5), surpriseStyle];
        
        setCurrentStyles(newStyles.sort(() => (Math.random() > .5) ? 1 : -1)); // Randomize order
        setSelectedStyles(new Set(newStyles.map(s => s.caption)));
    };
    
    const handleToggleStyle = (caption: string) => {
        setSelectedStyles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(caption)) {
                newSet.delete(caption);
            } else {
                newSet.add(caption);
            }
            return newSet;
        });
    };

    const handleGenerateClick = async () => {
        if (!uploadedImage || selectedStyles.size === 0) return;

        cancelGenerationRef.current = false;
        setIsRestoredSession(false); // This is a new session
        const generationCost = selectedStyles.size;

        if (!isPro && credits < generationCost) {
            addToast(`You need ${generationCost} credits, but you only have ${credits}.`, 'error');
            setIsGetCreditsModalOpen(true);
            return;
        }

        if (!isPro) {
            setCredits(prev => prev - generationCost);
        }

        setAppState('generating');
        const stylesToGenerate = currentStyles.filter(style => selectedStyles.has(style.caption));
        setActiveSessionStyles(stylesToGenerate);
        
        const initialImages: Record<string, GeneratedImage> = {};
        const generationQueue = stylesToGenerate.map(style => {
             let caption = style.caption;
            if (style.caption === 'Surprise Me!') {
                const randomStyle = SURPRISE_STYLES[Math.floor(Math.random() * SURPRISE_STYLES.length)];
                caption = `${randomStyle}`;
            }
            initialImages[style.caption] = { status: 'pending', caption };
            return { originalStyle: style.caption, caption: initialImages[style.caption].caption };
        });
        
        setGeneratedImages(initialImages);
        let finalImages = { ...initialImages };

        for (let i = 0; i < generationQueue.length; i++) {
            if (cancelGenerationRef.current) {
                console.log("Generation cancelled by user.");
                break;
            }
            setGeneratingIndex(i);
            const { originalStyle, caption } = generationQueue[i];
            
            try {
                const prompt = `Reimagine the person in this photo in the style of ${caption}. This includes clothing, hairstyle, photo quality, and the overall aesthetic of that style. The output must be a photorealistic image showing the person clearly.`;
                const resultUrl = await generateStyledImage(uploadedImage, prompt, caption);
                finalImages = {
                    ...finalImages,
                    [originalStyle]: { ...finalImages[originalStyle], status: 'done', url: resultUrl },
                };
            } catch (err) {
                 const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                finalImages = {
                    ...finalImages,
                    [originalStyle]: { ...finalImages[originalStyle], status: 'error', error: errorMessage },
                };
                console.error(`Failed to generate image for ${originalStyle}:`, err);
            }
            setGeneratedImages({ ...finalImages });
        }
        
        setGeneratingIndex(null);
        if (!cancelGenerationRef.current) {
            setAppState('results-shown');
        }
    };

    const handleCancelGeneration = () => {
        cancelGenerationRef.current = true;
        setAppState('image-uploaded');
        if (!isPro) {
            setCredits(prev => prev + activeSessionStyles.length); // Refund credits for the cancelled session
        }
        addToast("Generation cancelled. Credits refunded.", "success");
    };

    const handleRegenerateStyle = async (style: string) => {
        if (!uploadedImage || generatedImages[style]?.status === 'pending') return;
        
        const regenerationCost = 1;
        if (!isPro && credits < regenerationCost) {
            setIsGetCreditsModalOpen(true);
            return;
        }

        if (!isPro) {
            setCredits(prev => prev - regenerationCost);
        }

        let newCaption = style;
        if (style === 'Surprise Me!') {
            const randomStyle = SURPRISE_STYLES[Math.floor(Math.random() * SURPRISE_STYLES.length)];
            newCaption = `${randomStyle}`;
        }

        setGeneratedImages(prev => ({ ...prev, [style]: { status: 'pending', caption: newCaption } }));

        try {
            const prompt = `Reimagine the person in this photo in the style of ${newCaption}. This includes clothing, hairstyle, photo quality, and the overall aesthetic of that style. The output must be a photorealistic image showing the person clearly.`;
            const resultUrl = await generateStyledImage(uploadedImage, prompt, newCaption);
            setGeneratedImages(prev => ({ ...prev, [style]: { ...prev[style], status: 'done', url: resultUrl } }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImages(prev => ({ ...prev, [style]: { ...prev[style], status: 'error', error: errorMessage } }));
            console.error(`Failed to regenerate image for ${style}:`, err);
        }
    };
    
    const handleReset = useCallback(() => {
        setUploadedImage(null);
        setGeneratedImages({});
        setAppState('idle');
        setActiveIndex(0);
        setIsRestoredSession(false);
        refreshLatestHistorySession();
        setCurrentStyles(DEFAULT_STYLES);
        setActiveSessionStyles([]);
    }, [refreshLatestHistorySession]);
    
    const handleRestoreSession = useCallback((session: HistorySession) => {
        setUploadedImage(session.uploadedImage);
        setGeneratedImages(session.generatedImages);
        // Infer active session styles from the generated images keys
        const restoredStyles = Object.keys(session.generatedImages).map(caption => {
            return ALL_STYLES.find(s => s.caption === caption) || DEFAULT_STYLES.find(s => s.caption === caption) || { caption, description: 'A restored style.' };
        });
        setActiveSessionStyles(restoredStyles);
        setActiveIndex(0);
        setAppState('results-shown');
        setIsHistoryModalOpen(false);
        setIsRestoredSession(true);
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
        const image = generatedImages[style];
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

            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                try {
                    // @ts-ignore
                    const clipboardItem = new ClipboardItem({ [blob.type]: blob });
                    // @ts-ignore
                    await navigator.clipboard.write([clipboardItem]);
                    addToast('Image copied to clipboard!');
                } catch (copyError) {
                    console.error('Fallback copy to clipboard failed:', copyError);
                    addToast('Sharing not supported. Please download image.', 'error');
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Share was cancelled.');
            } else {
                console.error('Error sharing:', error);
                addToast('Could not share image.', 'error');
            }
        }
    };

    const handleShareIndividualImage = (style: string) => {
        const image = generatedImages[style];
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
        setIsDownloading(true);
        try {
            const imageData = Object.entries(generatedImages)
                .filter(([, image]: [string, GeneratedImage]) => image.status === 'done' && image.url)
                .reduce((acc, [style, image]: [string, GeneratedImage]) => {
                    acc[image.caption] = image.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length === 0) {
                addToast("No images have been generated yet.", 'error');
                return;
            }

            const albumDataUrl = await createAlbumPage(imageData);
            const link = document.createElement('a');
            link.href = albumDataUrl;
            link.download = 'alterego-album.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to create or download album:", error);
            addToast("Error creating your album.", 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadZip = async () => {
        setIsZipping(true);
        try {
            const zip = new JSZip();
            const successfulImages = Object.entries(generatedImages)
                .filter(([, image]: [string, GeneratedImage]) => image.status === 'done' && image.url);
    
            if (successfulImages.length === 0) {
                addToast("No images have been generated yet.", 'error');
                return;
            }
    
            successfulImages.forEach(([, image]: [string, GeneratedImage]) => {
                const imageDataUrl = image.url!;
                const base64Data = imageDataUrl.split(',')[1];
                const filename = `alterego-${image.caption.toLowerCase().replace(/\s/g, '-')}.png`;
                zip.file(filename, base64Data, { base64: true });
            });
    
            const content = await zip.generateAsync({ type: 'blob' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'alterego-images.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
    
        } catch (error) {
            console.error("Failed to create or download zip file:", error);
            addToast("Error creating your zip file.", 'error');
        } finally {
            setIsZipping(false);
        }
    };

    const handleShareAlbum = async () => {
        setIsSharing(true);
        try {
            const imageData = Object.entries(generatedImages)
                .filter(([, image]: [string, GeneratedImage]) => image.status === 'done' && image.url)
                .reduce((acc, [style, image]: [string, GeneratedImage]) => {
                     acc[image.caption] = image.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length === 0) {
                addToast("No images have been generated yet.", 'error');
                return;
            }
            const albumDataUrl = await createAlbumPage(imageData);
            await handleShare(
                albumDataUrl,
                'My AlterEgo AI Album',
                'Check out my album generated by AlterEgo AI! #AlterEgoAI',
                'alterego-album.jpg'
            );
        } catch (error) {
            console.error("Failed to create or share album:", error);
            addToast("Error creating album for sharing.", 'error');
        } finally {
            setIsSharing(false);
        }
    };
    
    const handleShareComparison = async (originalUrl: string, generatedUrl: string, caption: string) => {
        setIsSharing(true);
        try {
            const comparisonDataUrl = await createComparisonImage(originalUrl, generatedUrl, caption);
            await handleShare(
                comparisonDataUrl,
                `My ${caption} Alter Ego!`,
                `Check out my before & after generated by AlterEgo AI! #AlterEgoAI`,
                `alterego-comparison-${caption.toLowerCase().replace(/\s/g, '-')}.jpg`
            );
        } catch (error) {
            console.error("Failed to create or share comparison:", error);
            addToast("Error creating comparison for sharing.", 'error');
        } finally {
            setIsSharing(false);
        }
    };

    const isProcessing = isDownloading || isZipping || isSharing;
    const currentStyle = activeSessionStyles[activeIndex];
    const currentImage = currentStyle ? generatedImages[currentStyle.caption] : null;

    return (
        <div className="bg-zinc-900 text-neutral-200 min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden relative font-inter">
            <div className="background-animate fixed top-0 left-0 w-full h-full"></div>
            
            <AnimatePresence>
                {!appLoaded && <SplashScreen />}
            </AnimatePresence>
            
            {appLoaded && (
                <>
                    <Header 
                        credits={credits} 
                        isPro={isPro} 
                        onGetCredits={() => setIsGetCreditsModalOpen(true)}
                        onShowFavorites={() => setIsFavoritesModalOpen(true)}
                        onShowHistory={() => setIsHistoryModalOpen(true)}
                    />
                    <main className="z-10 flex flex-col items-center justify-center w-full h-full flex-1 pt-24 pb-12">
                        <AnimatePresence mode="wait">
                            {appState === 'idle' && (
                                <motion.div
                                    key="idle"
                                    {...{
                                        variants: containerVariants,
                                        initial: "hidden",
                                        animate: "visible",
                                        exit: { opacity: 0, y: -20 },
                                    }}
                                    className="text-center flex flex-col items-center w-full max-w-4xl mx-auto"
                                >
                                    {latestHistorySession ? (
                                        <>
                                            <motion.div {...{variants: itemVariants}}><Logo size="large" className="mb-4" /></motion.div>
                                            <motion.h2 {...{variants: itemVariants}} className="text-neutral-300 mt-2 text-xl md:text-2xl tracking-wide max-w-2xl">
                                                Welcome Back!
                                            </motion.h2>
                                            
                                            <motion.div {...{variants: itemVariants}} className="grid grid-cols-3 gap-4 my-8 w-full max-w-md">
                                                {Object.values(latestHistorySession.generatedImages)
                                                    .filter((img: GeneratedImage) => img.status === 'done' && img.url)
                                                    .slice(0, 3)
                                                    .map((image: GeneratedImage, index) => (
                                                        <div key={index} className="aspect-square bg-neutral-800 rounded-lg overflow-hidden relative shadow-lg">
                                                            <img src={image.url} alt={image.caption} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                            <p className="absolute bottom-2 left-3 text-white font-bold text-sm truncate">{image.caption}</p>
                                                        </div>
                                                    ))}
                                            </motion.div>

                                            <motion.div {...{variants: itemVariants}} className="flex flex-col sm:flex-row items-center gap-4">
                                                 <button onClick={() => handleRestoreSession(latestHistorySession)} className={primaryButtonClasses}>
                                                    <History size={20} />
                                                    View Full Session
                                                </button>
                                                <div className="text-neutral-500 font-bold text-sm">OR</div>
                                                <label htmlFor="file-upload-welcome-back" className={`${secondaryButtonClasses} cursor-pointer`}>
                                                    <FileImage size={20} />
                                                    Start New
                                                </label>
                                                <input id="file-upload-welcome-back" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                                            </motion.div>
                                        </>
                                    ) : (
                                        <>
                                            <motion.div {...{variants: itemVariants}}><Logo size="large" className="mb-4" /></motion.div>
                                            <motion.p {...{variants: itemVariants}} className="text-neutral-300 mt-2 text-xl md:text-2xl tracking-wide max-w-2xl">Cross into new realities. Upload a photo to see your digital self.</motion.p>
                                            
                                            <motion.div {...{variants: itemVariants}} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full">
                                                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 flex flex-col items-center">
                                                    <Infinity size={32} className="text-blue-400 mb-3" />
                                                    <h3 className="font-bold text-xl text-white mb-1">Unlimited Styles</h3>
                                                    <p className="text-neutral-400 text-sm">From vintage classics to futuristic visions.</p>
                                                </div>
                                                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 flex flex-col items-center">
                                                    <Palette size={32} className="text-purple-400 mb-3" />
                                                    <h3 className="font-bold text-xl text-white mb-1">Surprise Me!</h3>
                                                    <p className="text-neutral-400 text-sm">Discover unique styles from Pop Art to Cyberpunk.</p>
                                                </div>
                                                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 flex flex-col items-center">
                                                    <Gift size={32} className="text-green-400 mb-3" />
                                                    <h3 className="font-bold text-xl text-white mb-1">Free Album</h3>
                                                    <p className="text-neutral-400 text-sm">Get a beautiful collage of all your results.</p>
                                                </div>
                                            </motion.div>
                                            
                                            <motion.div {...{variants: itemVariants}} className="mt-12 flex flex-col sm:flex-row items-center gap-4">
                                                <label htmlFor="file-upload" className={`${primaryButtonClasses} cursor-pointer`}>
                                                    <FileImage size={24} />
                                                    Upload Photo
                                                </label>
                                                <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                                                <button onClick={() => setIsCameraOpen(true)} className={secondaryButtonClasses}>
                                                    <Camera size={24} />
                                                    Take Photo
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </motion.div>
                            )}

                            {appState === 'image-uploaded' && uploadedImage && (
                                <motion.div
                                    key="uploaded"
                                    {...{
                                        initial: { opacity: 0, scale: 0.9 },
                                        animate: { opacity: 1, scale: 1 },
                                        exit: { opacity: 0, scale: 0.9 },
                                        transition: { duration: 0.3 },
                                    }}
                                    className="flex flex-col items-center w-full max-w-5xl"
                                >
                                    <div className="text-center mb-8">
                                        <h2 className="font-sora text-2xl sm:text-3xl font-bold">Choose Your Alter Egos</h2>
                                        <p className="text-neutral-400 mt-1">Select the styles you want to generate.</p>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                                        {currentStyles.map((style) => (
                                            <motion.div
                                                key={style.caption}
                                                {...{variants: itemVariants}}
                                                className="relative group cursor-pointer"
                                                onClick={() => handleToggleStyle(style.caption)}
                                            >
                                                <div className={`aspect-square bg-neutral-800 rounded-lg p-3 flex flex-col justify-end transition-all duration-300 border-2 ${selectedStyles.has(style.caption) ? 'border-blue-500 scale-105' : 'border-transparent group-hover:border-neutral-600'}`}>
                                                    <AnimatePresence>
                                                        {selectedStyles.has(style.caption) && (
                                                            <motion.div {...{initial:{scale:0}, animate:{scale:1}, exit:{scale:0}}} className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-0.5">
                                                                <CheckCircle size={16} />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                    <h3 className="font-bold text-sm text-white">{style.caption}</h3>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); setInfoStyle(style); }} className="absolute top-2 left-2 p-1 text-neutral-400 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Info size={14} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-4 mt-4">
                                         <motion.button {...{whileTap:{ scale: 0.95 }}} onClick={handleShuffleStyles} className={secondaryButtonClasses} title="Shuffle Styles">
                                            <Dices size={24} />
                                        </motion.button>
                                        <motion.button
                                            {...{whileTap:{ scale: 0.95 }}}
                                            onClick={handleGenerateClick}
                                            disabled={selectedStyles.size === 0}
                                            className={primaryButtonClasses}
                                        >
                                            <Sparkles size={24} />
                                            {isPro ? 'Generate' : `Generate (${selectedStyles.size} Credits)`}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}

                             {appState === 'generating' && uploadedImage && (
                                 <GeneratingView
                                    uploadedImage={uploadedImage}
                                    generatedImages={generatedImages}
                                    generatingIndex={generatingIndex}
                                    styles={activeSessionStyles.map(s => s.caption)}
                                    onCancel={handleCancelGeneration}
                                />
                            )}


                            {appState === 'results-shown' && (
                                <motion.div
                                    key="results"
                                    {...{
                                        initial: { opacity: 0 },
                                        animate: { opacity: 1 },
                                        transition: { duration: 0.5 },
                                    }}
                                    className="w-full h-full flex flex-col items-center justify-between"
                                >
                                    <div className="flex-1 flex items-center justify-center w-full">
                                      <AnimatePresence mode="wait">
                                          <motion.div
                                              key={activeIndex}
                                              {...{
                                                  initial: { opacity: 0, y: 20, scale: 0.95 },
                                                  animate: { opacity: 1, y: 0, scale: 1 },
                                                  exit: { opacity: 0, y: -20, scale: 0.95 },
                                                  transition: { type: 'spring', stiffness: 120, damping: 20 },
                                              }}
                                              className="flex justify-center"
                                          >
                                              {currentStyle && currentImage && 
                                                <PhotoCard
                                                    caption={currentImage?.caption || currentStyle.caption}
                                                    isSurprise={currentStyle.caption === 'Surprise Me!'}
                                                    status={currentImage?.status || 'pending'}
                                                    imageUrl={currentImage?.url}
                                                    originalImageUrl={uploadedImage}
                                                    error={currentImage?.error}
                                                    onRegenerate={() => handleRegenerateStyle(currentStyle.caption)}
                                                    onDownload={() => handleDownloadIndividualImage(currentStyle.caption)}
                                                    onShare={() => handleShareIndividualImage(currentStyle.caption)}
                                                    onShareComparison={handleShareComparison}
                                                    canRegenerate={isPro || credits >= 1}
                                                    isFavorited={!!(currentImage?.url && favoritedImages[currentImage.url])}
                                                    onToggleFavorite={toggleFavorite}
                                                />
                                              }
                                          </motion.div>
                                      </AnimatePresence>
                                    </div>

                                    <div className="flex justify-center items-center gap-3 my-4">
                                        {activeSessionStyles.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setActiveIndex(index)}
                                                className="w-2.5 h-2.5 rounded-full relative transition-colors duration-300 bg-white/40 hover:bg-white/70"
                                                aria-label={`Go to image ${index + 1}`}
                                            >
                                             {activeIndex === index && (
                                                    <motion.div
                                                        {...{
                                                            layoutId: "active-dot",
                                                            initial: false,
                                                            transition: { type: 'spring', stiffness: 500, damping: 30 },
                                                        }}
                                                        className="absolute inset-0 bg-white rounded-full"
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="py-4 flex items-center justify-center">
                                        <motion.div
                                            {...{
                                                initial: { opacity: 0, y: 20 },
                                                animate: { opacity: 1, y: 0 },
                                                transition: { delay: 0.5, duration: 0.5 },
                                            }}
                                            className="flex flex-wrap items-center justify-center gap-4"
                                        >
                                            <motion.button
                                                {...{whileTap:{ scale: 0.95 }}}
                                                onClick={handleDownloadAlbum}
                                                disabled={isProcessing}
                                                className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {isDownloading ? 'Creating Album...' : 'Download Album'}
                                            </motion.button>
                                            <motion.button
                                                {...{whileTap:{ scale: 0.95 }}}
                                                onClick={handleDownloadZip}
                                                disabled={isProcessing}
                                                className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {isZipping ? 'Zipping...' : 'Download All (ZIP)'}
                                            </motion.button>
                                            <motion.button
                                                {...{whileTap:{ scale: 0.95 }}}
                                                onClick={handleShareAlbum}
                                                disabled={isProcessing}
                                                className={`${secondaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {isSharing ? 'Sharing...' : 'Share Album'}
                                            </motion.button>
                                            <motion.button {...{whileTap:{ scale: 0.95 }}} onClick={handleReset} className={secondaryButtonClasses}>
                                                Start Over
                                            </motion.button>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                    <footer className="fixed bottom-2 right-4 z-50">
                        <p className="text-xs text-neutral-500/50">Powered by Dexify, Built by CodeDeX</p>
                    </footer>
                </>
            )}

            <AnimatePresence>
                {infoStyle && (
                    <motion.div
                        {...{
                            initial: { opacity: 0 },
                            animate: { opacity: 1 },
                            exit: { opacity: 0 },
                        }}
                        onClick={() => setInfoStyle(null)}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            {...{
                                initial: { scale: 0.9, opacity: 0 },
                                animate: { scale: 1, opacity: 1 },
                                exit: { scale: 0.9, opacity: 0 },
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-neutral-800 border border-white/20 rounded-lg p-6 max-w-sm text-center"
                        >
                            <h3 className="text-xl font-bold font-sora mb-2">{infoStyle.caption}</h3>
                            <p className="text-neutral-300">{infoStyle.description}</p>
                            <button onClick={() => setInfoStyle(null)} className="mt-4 bg-blue-600 text-white font-bold px-4 py-2 rounded-full text-sm">Got it</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Suspense fallback={<div />}>
                <AnimatePresence>
                    {isCameraOpen && (
                        <CameraView 
                            onCapture={handlePhotoTaken}
                            onClose={() => setIsCameraOpen(false)}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isGetCreditsModalOpen && (
                        <GetCreditsModal
                            onClose={() => setIsGetCreditsModalOpen(false)}
                            setCredits={setCredits}
                            setIsPro={setIsPro}
                        />
                    )}
                </AnimatePresence>
                 <AnimatePresence>
                    {isFavoritesModalOpen && (
                        <FavoritesModal
                            images={Object.values(favoritedImages)}
                            onClose={() => setIsFavoritesModalOpen(false)}
                            onToggleFavorite={toggleFavorite}
                            onDownload={handleDownloadFromUrl}
                            onShare={(url, caption) => handleShare(
                                url,
                                `My ${caption} Look!`,
                                `Check out my ${caption} photo generated by AlterEgo AI! #AlterEgoAI`,
                                `alterego-${caption.toLowerCase().replace(/\s/g, '-')}.png`
                            )}
                            onShareComparison={handleShareComparison}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {isHistoryModalOpen && (
                        <HistoryModal
                            onClose={() => setIsHistoryModalOpen(false)}
                            onRestoreSession={handleRestoreSession}
                        />
                    )}
                </AnimatePresence>
            </Suspense>
        </div>
    );
}

export default App;