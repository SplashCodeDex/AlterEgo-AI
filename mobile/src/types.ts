/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// This file is migrated from the web application and is platform-agnostic.
// It can be used directly in the React Native project.

export type ImageStatus = 'pending' | 'done' | 'error';

export interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
    caption: string; 
}

export interface HistorySession {
    uploadedImage: string;
    generatedImages: Record<string, GeneratedImage>;
    timestamp: number;
}

export interface FavoritedImage {
    url: string;
    caption: string;
    originalUrl: string;
}
