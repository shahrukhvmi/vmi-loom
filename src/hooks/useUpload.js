/**
 * useUpload
 *
 * Drives the mock upload flow. Replace uploadRecording() in
 * uploadService.js with the real Cloudflare implementation later.
 */

import { useCallback } from 'react';
import { useRecorderStore } from '../context/recorderStore';
import { uploadRecording } from '../services/uploadService';
import { RECORDING_STATE } from '../constants';

export function useUpload() {
  const store = useRecorderStore();

  const upload = useCallback(async (title = 'Untitled Recording') => {
    const { recordedBlob } = store;
    if (!recordedBlob) return;

    store.setRecordingState(RECORDING_STATE.UPLOADING);
    store.setUploadProgress(0);
    store.clearError();

    try {
      const record = await uploadRecording(
        recordedBlob,
        { title, privacy: 'private' },
        (progress) => store.setUploadProgress(progress)
      );

      store.setUploadProgress(100);
      store.setUploadedRecord(record);
      store.setRecordingState(RECORDING_STATE.UPLOADED);
    } catch (err) {
      store.setError(err.message || 'Upload failed.');
      store.setRecordingState(RECORDING_STATE.PREVIEW);
    }
  }, [store]);

  return { upload };
}
