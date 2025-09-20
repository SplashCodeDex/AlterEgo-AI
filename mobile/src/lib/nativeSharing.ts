/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Share, Alert, Platform } from 'react-native';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';

/**
 * Saves a file (from a URI) to the device's camera roll.
 * Handles Android and iOS permissions.
 * @param uri The URI of the file to save (can be a local file path or a data URI).
 * @param type The type of media, 'photo' or 'video'.
 */
export async function saveToCameraRoll(uri: string, type: 'photo' | 'video'): Promise<void> {
  if (Platform.OS === 'android') {
    const permission = Platform.Version >= 33 
      ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES 
      : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;
      
    const status = await request(permission);
    if (status !== RESULTS.GRANTED) {
      Alert.alert('Permission Denied', 'Cannot save to photo library without permission.');
      return;
    }
  }

  try {
    await CameraRoll.save(uri, { type });
  } catch (error) {
    console.error("Failed to save to camera roll", error);
    Alert.alert('Error', 'Could not save to photo library.');
  }
}

/**
 * Opens the native OS share sheet to share an image.
 * @param uri The URI of the image to share.
 * @param title The title of the share content.
 * @param message The message to accompany the share.
 */
export async function shareImage(uri: string, title: string, message: string): Promise<void> {
    try {
        await Share.share({
            title,
            message,
            url: uri, // The local file URI
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('User did not share')) {
             console.log('Share was cancelled by the user.');
        } else {
            console.error('Error sharing image:', error);
            Alert.alert('Error', 'Could not share the image.');
        }
    }
}