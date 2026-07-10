/**
 * Upload Service
 *
 * Orchestrates the full upload flow: request URL → upload → confirm.
 * Currently uses mock Cloudflare service. Swap implementations here
 * when the real backend is ready — no component changes needed.
 */

import {
  requestDirectUploadURL,
  uploadVideoToCloudflare,
  confirmVideoUpload,
} from './cloudflareService';

/**
 * Full upload pipeline for a recorded video.
 *
 * @param {Blob} blob - The recorded video blob
 * @param {object} meta - { title, privacy }
 * @param {function} onProgress - Progress callback (0–100)
 * @returns {Promise<object>} - Confirmed video record
 */
export async function uploadRecording(blob, meta, onProgress) {
  // Step 1: Get a one-time direct upload URL from the backend
  const { uploadURL, uid } = await requestDirectUploadURL();

  // Step 2: Upload the blob directly to Cloudflare Stream
  await uploadVideoToCloudflare(uploadURL, blob, onProgress);

  // Step 3: Confirm with the backend (stores metadata in MySQL)
  const record = await confirmVideoUpload({
    cloudflareUid: uid,
    title: meta.title || 'Untitled Recording',
    privacy: meta.privacy || 'private',
  });

  return record;
}
