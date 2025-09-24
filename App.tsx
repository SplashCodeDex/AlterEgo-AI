/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { lazy, Suspense } from 'react';
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