/**
 * useMicrophone
 *
 * Manages microphone stream acquisition and release.
 */

import { useCallback, useRef } from 'react';
import { useRecorderStore } from '../context/recorderStore';
import { PERMISSION_STATE } from '../constants';
import { stopAllTracks } from '../utils';

export function useMicrophone() {
  const { setPermission, setStreams, micStream } = useRecorderStore();
  const streamRef = useRef(null);

  const startMicrophone = useCallback(async (deviceId) => {
    try {
      const constraints = {
        audio: deviceId
          ? { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true }
          : { echoCancellation: true, noiseSuppression: true },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setStreams({ micStream: stream });
      setPermission('microphone', PERMISSION_STATE.GRANTED);
      return stream;
    } catch (err) {
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermission('microphone', PERMISSION_STATE.NOT_FOUND);
        throw new Error('No microphone found.');
      }
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermission('microphone', PERMISSION_STATE.DENIED);
        throw new Error('Microphone permission denied. Please allow microphone access in your browser settings.');
      }
      throw err;
    }
  }, [setPermission, setStreams]);

  const stopMicrophone = useCallback(() => {
    stopAllTracks(streamRef.current);
    streamRef.current = null;
    setStreams({ micStream: null });
  }, [setStreams]);

  return { micStream, startMicrophone, stopMicrophone };
}
