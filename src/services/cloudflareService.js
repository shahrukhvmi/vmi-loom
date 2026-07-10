/**
 * Cloudflare Stream & R2 Service
 *
 * All methods are placeholders. Replace each TODO block with
 * the real Cloudflare API calls when the backend is ready.
 *
 * Docs:
 *  - Stream: https://developers.cloudflare.com/stream/
 *  - Direct Creator Uploads: https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/
 *  - R2: https://developers.cloudflare.com/r2/
 */

const CLOUDFLARE_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Request a one-time direct upload URL from your Laravel backend.
 * The backend calls Cloudflare and returns the URL so the API token
 * never touches the frontend.
 *
 * @returns {Promise<{ uploadURL: string, uid: string }>}
 */
export async function requestDirectUploadURL() {
  // TODO: Replace with real API call
  // const res = await fetch(`${CLOUDFLARE_BASE_URL}/api/videos/upload-url`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  // });
  // return res.json();

  // MOCK: Simulate network delay
  await new Promise((r) => setTimeout(r, 800));
  return {
    uploadURL: 'https://mock.cloudflare.stream/upload/placeholder',
    uid: `mock-uid-${Date.now()}`,
  };
}

/**
 * Upload the recorded video Blob directly to Cloudflare Stream
 * using the one-time upload URL.
 *
 * @param {string} uploadURL - One-time URL from requestDirectUploadURL()
 * @param {Blob} blob - The recorded video blob
 * @param {function} onProgress - Progress callback (0–100)
 * @returns {Promise<{ uid: string }>}
 */
export async function uploadVideoToCloudflare(uploadURL, blob, onProgress) {
  // TODO: Replace mock with real upload
  // const xhr = new XMLHttpRequest();
  // xhr.open('POST', uploadURL);
  // xhr.upload.onprogress = (e) => {
  //   if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
  // };
  // return new Promise((resolve, reject) => {
  //   xhr.onload = () => resolve(JSON.parse(xhr.responseText));
  //   xhr.onerror = reject;
  //   xhr.send(blob);
  // });

  // MOCK: Simulate upload progress
  for (let i = 0; i <= 100; i += 10) {
    await new Promise((r) => setTimeout(r, 120));
    onProgress?.(i);
  }
  return { uid: `mock-uid-${Date.now()}` };
}

/**
 * Notify the backend that upload is complete; it stores metadata in MySQL.
 *
 * @param {object} payload - { cloudflareUid, title, privacy }
 * @returns {Promise<object>} - Video record from backend
 */
export async function confirmVideoUpload(payload) {
  // TODO: Replace with real API call
  // const res = await fetch(`${CLOUDFLARE_BASE_URL}/api/videos`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  //   body: JSON.stringify(payload),
  // });
  // return res.json();

  await new Promise((r) => setTimeout(r, 400));
  return { id: Date.now(), ...payload, status: 'processing' };
}

/**
 * Delete a video from Cloudflare Stream via the backend.
 *
 * @param {string} videoId - Backend video ID
 */
export async function deleteVideo(videoId) {
  // TODO: Replace with real API call
  // await fetch(`${CLOUDFLARE_BASE_URL}/api/videos/${videoId}`, {
  //   method: 'DELETE',
  //   headers: { Authorization: `Bearer ${token}` },
  // });

  await new Promise((r) => setTimeout(r, 300));
  console.log('[CloudflareService] Mock delete for video:', videoId);
}

/**
 * Upload a thumbnail image to Cloudflare R2.
 *
 * @param {Blob} imageBlob - PNG/JPEG screenshot
 * @param {string} videoId - Associated video ID
 * @returns {Promise<{ url: string }>}
 */
export async function uploadThumbnail(imageBlob, videoId) {
  // TODO: Replace with R2 upload via backend presigned URL
  // const { presignedUrl } = await fetch(`${CLOUDFLARE_BASE_URL}/api/videos/${videoId}/thumbnail-url`).then(r => r.json());
  // await fetch(presignedUrl, { method: 'PUT', body: imageBlob });

  await new Promise((r) => setTimeout(r, 300));
  return { url: URL.createObjectURL(imageBlob) };
}

/**
 * Trigger Cloudflare to generate a downloadable MP4.
 *
 * @param {string} videoId - Backend video ID
 */
export async function requestMp4Download(videoId) {
  // TODO: Replace with real API call
  // await fetch(`${CLOUDFLARE_BASE_URL}/api/videos/${videoId}/generate-download`, { method: 'POST', ... });

  await new Promise((r) => setTimeout(r, 500));
  return { status: 'generating' };
}
