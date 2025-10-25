import React, { lazy, Suspense, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoCard from './components/PhotoCard';
import Header from './components/Header';
import { FileImage, Sparkles, X, Infinity, Palette, Gift, Camera, PartyPopper, History, Dices, Info, CheckCircle } from 'lucide-react';
import SplashScreen from './components/SplashScreen';
import Logo from './components/Logo';
import GeneratingView from './components/GeneratingView';
import type { GeneratedImage } from './types';
import { useAppContext } from './src/state/AppContext';

// Lazy load heavy components
const GetCreditsModal = lazy(() => import('./components/GetCreditsModal'));
const CameraView = lazy(() => import('./components/CameraView'));
const FavoritesModal = lazy(() => import('./components/FavoritesModal'));
const HistoryModal = lazy(() => import('./components/HistoryModal'));

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
const { state, actions } = useAppContext();
const {
appLoaded,
appState,
credits,
isPro,
latestHistorySession,
uploadedImage,
currentStyles,
selectedStyles,
infoStyle,
isGetCreditsModalOpen,
isCameraOpen,
isFavoritesModalOpen,
isHistoryModalOpen,
activeSessionStyles,
generatedImages,
generatingIndex,
activeIndex,
isDownloading,
isZipping,
isSharing,
favoritedImages
} = state;

    const {
        handleImageUpload,
        handlePhotoTaken,
        handleToggleStyle,
        handleShuffleStyles,
        handleGenerateClick,
        handleCancelGeneration,
        handleRegenerateStyle,
        handleReset,
        handleRestoreSession,
        handleDownloadIndividualImage,
        handleShareIndividualImage,
        handleShareComparison,
        handleDownloadAlbum,
        handleDownloadZip,
        handleShareAlbum,
        setInfoStyle,
        setIsGetCreditsModalOpen,
        setIsCameraOpen,
        setIsFavoritesModalOpen,
        setIsHistoryModalOpen,
        setActiveIndex,
        toggleFavorite,
        handleDownloadFromUrl,
        handleShare,
        setCredits,
        setIsPro
    } = actions;

    const isProcessing = useMemo(() => isDownloading || isZipping || isSharing, [isDownloading, isZipping, isSharing]);
    const currentStyle = useMemo(() => activeSessionStyles[activeIndex], [activeSessionStyles, activeIndex]);
    const currentImage = useMemo(() => currentStyle ? generatedImages[currentStyle.caption] : null, [currentStyle, generatedImages]);

    const openGetCreditsModal = useCallback(() => setIsGetCreditsModalOpen(true), [setIsGetCreditsModalOpen]);
    const openFavoritesModal = useCallback(() => setIsFavoritesModalOpen(true), [setIsFavoritesModalOpen]);
    const openHistoryModal = useCallback(() => setIsHistoryModalOpen(true), [setIsHistoryModalOpen]);
    const handleRestoreLatestSession = useCallback(() => latestHistorySession && handleRestoreSession(latestHistorySession), [latestHistorySession, handleRestoreSession]);

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
                        onGetCredits={openGetCreditsModal}
                        onShowFavorites={openFavoritesModal}
                        onShowHistory={openHistoryModal}
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
                                                 <button onClick={handleRestoreLatestSession} className={primaryButtonClasses}>
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
                        </AnimatePresence>
                    </main>
                </>
            )}
        </div>
    );

}

export default App;
