/**
 * useCamera
 *
 * FIX: Request higher resolution (1920x1080 ideal) so the camera overlay
 * in composited recordings looks sharp instead of blurry/pixelated.
 */

import { useCallback, useRef } from 'react';
import { useRecorderStore } from '../context/recorderStore';
import { PERMISSION_STATE } from '../constants';
import { stopAllTracks } from '../utils';

export function useCamera() {
  const { setPermission, setStreams, cameraStream } = useRecorderStore();
  const streamRef = useRef(null);

  const startCamera = useCallback(async (deviceId) => {
    try {
      const videoConstraints = deviceId
        ? {
            deviceId: { exact: deviceId },
            width:  { ideal: 1280, max: 1920 },
            height: { ideal: 720,  max: 1080 },
            frameRate: { ideal: 30 },
          }
        : {
            width:  { ideal: 1280, max: 1920 },
            height: { ideal: 720,  max: 1080 },
            frameRate: { ideal: 30 },
            facingMode: 'user',
          };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      streamRef.current = stream;
      setStreams({ cameraStream: stream });
      setPermission('camera', PERMISSION_STATE.GRANTED);
      return stream;

    } catch (err) {
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermission('camera', PERMISSION_STATE.NOT_FOUND);
        throw new Error('No camera device found.');
      }
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermission('camera', PERMISSION_STATE.DENIED);
        throw new Error('Camera permission denied. Please allow camera access in your browser settings.');
      }
      if (err.name === 'AbortError') {
        setPermission('camera', PERMISSION_STATE.CANCELLED);
        throw new Error('Camera access was cancelled.');
      }
      throw err;
    }
  }, [setPermission, setStreams]);

  const stopCamera = useCallback(() => {
    stopAllTracks(streamRef.current);
    streamRef.current = null;
    setStreams({ cameraStream: null });
  }, [setStreams]);

  return { cameraStream, startCamera, stopCamera };
}
