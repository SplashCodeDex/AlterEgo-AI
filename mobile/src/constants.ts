/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Centralized definitions for all available styles.

export interface Style {
    caption: string;
    description: string;
}

export const ALL_STYLES: Style[] = [
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

export const DEFAULT_STYLES: Style[] = [
    { caption: '1950s', description: 'A dramatic, black and white Film Noir look with sharp shadows.' },
    { caption: '1970s', description: 'Get ready for the disco floor with vibrant colors and a groovy vibe.' },
    { caption: '1990s', description: 'Embrace the alternative scene with a moody, grunge-inspired aesthetic.' },
    { caption: 'Victorian', description: 'A formal, sepia-toned portrait from the age of invention.' },
    { caption: 'Future', description: 'Step into a neon-lit, high-tech city of tomorrow.' },
    { caption: 'Surprise Me!', description: 'A random portal to an unknown style. What will you become?' }
];

export const SURPRISE_STYLES = ['1920s Art Deco', '1960s Psychedelic', 'Cyberpunk', 'Steampunk', 'Fantasy Portrait', 'Pop Art', 'Anime', 'Vaporwave'];


// IMPORTANT: Replace these placeholder SKUs with your actual Product IDs from App Store Connect and Google Play Console.
export const IAP_SKUS = {
    // Consumable credit packs
    credits_30: 'com.alterego.credits30',
    credits_100: 'com.alterego.credits100',
    credits_500: 'com.alterego.credits500',
    // Subscription for PRO access
    pro_monthly: 'com.alterego.pro.monthly',
};
