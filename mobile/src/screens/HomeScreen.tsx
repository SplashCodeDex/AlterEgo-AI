/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Modal, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import ViewShot from 'react-native-view-shot';
import Header from '../components/Header';
import Logo from '../components/Logo';
import { FileImage, Camera, Infinity, Palette, Gift, Sparkles, Dices } from 'lucide-react-native';
import StyleSelectionGrid from '../components/StyleSelectionGrid';
import SubscriptionModal from '../components/SubscriptionModal';
import GeneratingView from '../components/GeneratingView';
import PhotoCard from '../components/PhotoCard';
import HistoryModal from '../components/HistoryModal';
import FavoritesModal from '../components/FavoritesModal';
import { useToasts } from '../components/Toaster';
import { useAppContext } from '../state/AppContext';
import AnimatedButton from '../components/AnimatedButton';

const primaryButtonStyles = StyleSheet.create({
    button: {
        backgroundColor: '#2563EB',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 9999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    text: {
        fontFamily: 'Inter-Bold',
        fontWeight: 'bold',
        fontSize: 18,
        color: 'white',
    }
});

const secondaryButtonStyles = StyleSheet.create({
    button: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    text: {
        fontFamily: 'Inter-Bold',
        fontWeight: 'bold',
        fontSize: 18,
        color: '#D4D4D4',
    }
});

const InfoCard = ({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) => (
    <View style={styles.infoCard}>
        {icon}
        <Text style={styles.infoCardTitle}>{title}</Text>
        <Text style={styles.infoCardText}>{text}</Text>
    </View>
);

const HomeScreen = () => {
    const { state, actions, iap, ImageProcessorComponent, viewShotRef } = useAppContext();
    const { addToast } = useToasts();
    
    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            actions.setActiveIndex(viewableItems[0].index);
        }
    }, [actions]);

    const viewabilityConfig = { itemVisiblePercentThreshold: 50 };
    const flatListWidth = Dimensions.get('window').width;

    const renderIdleView = () => (
        <View style={styles.idleContainer}>
            {state.latestHistorySession ? (
                 <View style={styles.idleContainer}>
                    <Logo size="large" style={styles.logo} />
                    <Text style={styles.welcomeBackText}>Welcome Back!</Text>
                    <View style={styles.historyPreviewContainer}>
                         {Object.values(state.latestHistorySession.generatedImages)
                            .filter(img => img.status === 'done' && img.url)
                            .slice(0, 3)
                            .map((image, index) => (
                                <View key={index} style={styles.historyPreviewItem}>
                                    <Image source={{ uri: image.url }} style={styles.historyPreviewImage} />
                                </View>
                            ))}
                    </View>
                    <View style={styles.buttonContainer}>
                        <AnimatedButton onPress={() => actions.handleRestoreSession(state.latestHistorySession!)} style={primaryButtonStyles.button}>
                            <Text style={primaryButtonStyles.text}>View Session</Text>
                        </AnimatedButton>
                         <AnimatedButton onPress={actions.handleUploadPhoto} style={secondaryButtonStyles.button}>
                            <Text style={secondaryButtonStyles.text}>Start New</Text>
                        </AnimatedButton>
                    </View>
                </View>
            ) : (
                <>
                    <Logo size="large" style={styles.logo} />
                    <Text style={styles.tagline}>
                        Cross into new realities. Upload a photo to see your digital self.
                    </Text>
                    <View style={styles.infoCardsContainer}>
                        <InfoCard 
                            icon={<Infinity size={32} stroke="#60A5FA" />} 
                            title="Unlimited Styles" 
                            text="From vintage classics to futuristic visions."
                        />
                        <InfoCard 
                            icon={<Palette size={32} stroke="#A78BFA" />} 
                            title="Surprise Me!" 
                            text="Discover unique styles from Pop Art to Cyberpunk."
                        />
                        <InfoCard 
                            icon={<Gift size={32} stroke="#34D399" />} 
                            title="Free Album" 
                            text="Get a beautiful collage of all your results."
                        />
                    </View>
                    <View style={styles.buttonContainer}>
                        <AnimatedButton style={primaryButtonStyles.button} onPress={actions.handleUploadPhoto}>
                            <FileImage size={24} stroke="white" />
                            <Text style={primaryButtonStyles.text}>Upload Photo</Text>
                        </AnimatedButton>
                        <AnimatedButton style={secondaryButtonStyles.button} onPress={actions.handleTakePhoto}>
                            <Camera size={24} stroke="#D4D4D4" />
                            <Text style={secondaryButtonStyles.text}>Take Photo</Text>
                        </AnimatedButton>
                    </View>
                </>
            )}
        </View>
    );

    const renderSelectionView = () => state.uploadedImage && (
        <View style={styles.selectionContainer}>
           <View style={styles.selectionHeader}>
               <Text style={styles.selectionTitle}>Choose Your Alter Egos</Text>
               <Text style={styles.selectionSubtitle}>Select the styles you want to generate.</Text>
           </View>
           
           <Image source={{ uri: state.uploadedImage }} style={styles.thumbnail} />

           <StyleSelectionGrid 
               styles={state.currentStyles}
               selectedStyles={state.selectedStyles}
               onToggleStyle={actions.handleToggleStyle}
           />

           <View style={styles.generateButtonContainer}>
               <AnimatedButton style={secondaryButtonStyles.button} onPress={actions.handleShuffleStyles}>
                   <Dices size={24} stroke="#D4D4D4" />
               </AnimatedButton>
                <AnimatedButton 
                   style={[primaryButtonStyles.button, state.selectedStyles.size === 0 && styles.disabledButton]} 
                   onPress={actions.handleGenerateClick}
                   disabled={state.selectedStyles.size === 0}
                >
                   <Sparkles size={24} stroke="white" />
                   <Text style={primaryButtonStyles.text}>
                       {state.isPro ? 'Generate' : `Generate (${state.selectedStyles.size} Credits)`}
                   </Text>
               </AnimatedButton>
           </View>
       </View>
    );

    const renderGeneratingView = () => state.uploadedImage && (
        <GeneratingView
            uploadedImage={state.uploadedImage}
            generatedImages={state.generatedImages}
            generatingIndex={state.generatingIndex}
            styleCaptions={state.activeSessionStyles}
            onCancel={actions.handleCancelGeneration}
        />
    );

    const renderResultsView = () => (
        <View style={styles.resultsContainer}>
            <FlatList
                data={state.activeSessionStyles}
                renderItem={({ item: style }) => {
                    const image = state.generatedImages[style];
                    return (
                        <View style={[styles.carouselItem, { width: flatListWidth }]}>
                            <PhotoCard
                                caption={image?.caption || style}
                                isSurprise={style === 'Surprise Me!'}
                                status={image?.status || 'pending'}
                                imageUrl={image?.url}
                                originalImageUrl={state.uploadedImage}
                                error={image?.error}
                                onRegenerate={() => actions.handleRegenerateStyle(style)}
                                onDownload={() => image?.url && actions.handleSaveToCameraRoll(image.url).then(() => addToast(`${image.caption} saved to photos.`, 'success'))}
                                onShare={() => image?.url && actions.handleShareImage(image.url, `My ${image.caption} Look!`, `Generated by AlterEgo AI`)}
                                onShareComparison={() => state.uploadedImage && image?.url && actions.handleShareComparison(state.uploadedImage, image.url, image.caption)}
                                canRegenerate={state.isPro || state.credits >= 1}
                                isFavorited={!!(image?.url && state.favoritedImages[image.url])}
                                onToggleFavorite={actions.toggleFavorite}
                            />
                        </View>
                    );
                }}
                keyExtractor={item => item}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                style={{ flexGrow: 0 }}
            />
            <View style={styles.dotsContainer}>
                {state.activeSessionStyles.map((_, index) => (
                    <View 
                        key={index}
                        style={[styles.dot, state.activeIndex === index ? styles.activeDot : {}]}
                    />
                ))}
            </View>
             <View style={styles.resultsActions}>
                 <AnimatedButton style={primaryButtonStyles.button} onPress={actions.handleDownloadAlbum}>
                    <Text style={primaryButtonStyles.text}>Download Album</Text>
                </AnimatedButton>
                 <AnimatedButton style={primaryButtonStyles.button} onPress={actions.handleShareAlbum}>
                    <Text style={primaryButtonStyles.text}>Share Album</Text>
                </AnimatedButton>
                <AnimatedButton style={secondaryButtonStyles.button} onPress={actions.handleReset}>
                    <Text style={secondaryButtonStyles.text}>Start Over</Text>
                </AnimatedButton>
            </View>
        </View>
    );

    const renderContent = () => {
        if (!state.hydrated) {
            return <ActivityIndicator size="large" color="#A1A1AA" />;
        }
        switch (state.appState) {
            case 'idle': return renderIdleView();
            case 'image-uploaded': return renderSelectionView();
            case 'generating': return renderGeneratingView();
            case 'results-shown': return renderResultsView();
            default: return null;
        }
    };


    return (
        <View style={styles.container}>
            <Header 
                credits={state.credits} 
                isPro={state.isPro} 
                onGetCredits={() => actions.openModal('subscription')}
                onShowFavorites={() => actions.openModal('favorites')}
                onShowHistory={() => actions.openModal('history')}
            />
            <ScrollView contentContainerStyle={styles.main}>
                {renderContent()}
            </ScrollView>

            {/* This ViewShot component is positioned off-screen to capture views without being visible */}
            {state.shareableView && (
                <View style={styles.hiddenViewShot}>
                    <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
                        {state.shareableView}
                    </ViewShot>
                </View>
            )}

            {/* This component is used for off-screen image processing (e.g., watermarking) */}
            {ImageProcessorComponent}

            <Text style={styles.footerText}>Powered by Dexify, Built by CodeDeX</Text>
            
            <Modal
                animationType="slide"
                transparent={true}
                visible={state.isSubscriptionModalOpen}
                onRequestClose={() => actions.closeModal('subscription')}
            >
                <SubscriptionModal 
                    onClose={() => actions.closeModal('subscription')}
                    subscriptions={iap.subscriptions}
                    products={iap.products}
                    onSubscribe={iap.requestSubscription}
                    onBuyCredits={iap.requestPurchase}
                />
            </Modal>
            
            <Modal
                animationType="slide"
                transparent={true}
                visible={state.isHistoryModalOpen}
                onRequestClose={() => actions.closeModal('history')}
            >
                <HistoryModal 
                    history={state.history}
                    onClose={() => actions.closeModal('history')}
                    onRestoreSession={actions.handleRestoreSession}
                    onClearHistory={actions.handleClearHistory}
                />
            </Modal>
            
            <Modal
                animationType="slide"
                transparent={true}
                visible={state.isFavoritesModalOpen}
                onRequestClose={() => actions.closeModal('favorites')}
            >
                <FavoritesModal
                    images={Object.values(state.favoritedImages)}
                    onClose={() => actions.closeModal('favorites')}
                    onToggleFavorite={actions.toggleFavorite}
                    onDownload={(url, caption) => actions.handleSaveToCameraRoll(url).then(() => addToast(`${caption} saved to photos.`, 'success'))}
                    onShare={(url, caption) => actions.handleShareImage(url, `My ${caption} Look!`, `Check out my ${caption} photo generated by AlterEgo AI! #AlterEgoAI`)}
                    onShareComparison={actions.handleShareComparison}
                />
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#18181B',
    },
    main: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        paddingTop: 80,
        paddingBottom: 40,
    },
    idleContainer: {
        alignItems: 'center',
        width: '100%',
    },
    welcomeBackText: {
        fontSize: 24,
        color: '#D4D4D4',
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        marginBottom: 24,
    },
    historyPreviewContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
        justifyContent: 'center',
        width: '100%',
    },
    historyPreviewItem: {
        width: 100,
        aspectRatio: 1,
        backgroundColor: '#27272A',
        borderRadius: 8,
        overflow: 'hidden',
    },
    historyPreviewImage: {
        width: '100%',
        height: '100%',
    },
    logo: {
        marginBottom: 16,
    },
    tagline: {
        color: '#A1A1AA',
        marginTop: 8,
        fontSize: 20,
        lineHeight: 28,
        textAlign: 'center',
        maxWidth: 320,
        fontFamily: 'Inter-Regular',
    },
    infoCardsContainer: {
        marginTop: 48,
        width: '100%',
        gap: 24,
    },
    infoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    infoCardTitle: {
        fontFamily: 'Inter-Bold',
        fontWeight: 'bold',
        fontSize: 20,
        color: 'white',
        marginTop: 12,
        marginBottom: 4,
    },
    infoCardText: {
        color: '#A1A1AA',
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    buttonContainer: {
        marginTop: 32,
        alignItems: 'center',
        gap: 16,
        flexDirection: 'row',
    },
    footerText: {
        position: 'absolute',
        bottom: 8,
        right: 16,
        fontSize: 10,
        color: 'rgba(161, 161, 170, 0.5)',
        zIndex: 50,
    },
    selectionContainer: {
        width: '100%',
        alignItems: 'center',
    },
    selectionHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    selectionTitle: {
        fontFamily: 'Sora-Bold',
        fontWeight: 'bold',
        fontSize: 28,
        color: 'white',
    },
    selectionSubtitle: {
        color: '#A1A1AA',
        marginTop: 4,
        fontSize: 16,
    },
    thumbnail: {
        width: 100,
        height: 100,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    generateButtonContainer: {
        marginTop: 32,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    disabledButton: {
        opacity: 0.5,
    },
    resultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    carouselItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 20
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginVertical: 16,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    activeDot: {
        backgroundColor: 'white',
    },
    resultsActions: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        marginTop: 16,
    },
    hiddenViewShot: {
        position: 'absolute',
        top: -10000, // Position off-screen
        left: 0,
    },
});

export default HomeScreen;