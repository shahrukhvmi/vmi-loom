/**
 * useScreenRecording
 *
 * Manages getDisplayMedia stream for screen/window capture.
 *
 * FIX: Request native resolution without artificial width/height caps —
 * setting ideal width/height can cause the browser to downscale the capture.
 * Use cursor:'always' and let the browser pick the highest quality available.
 */

import { useCallback } from 'react';
import { useRecorderStore } from '../context/recorderStore';
import { PERMISSION_STATE } from '../constants';
import { stopAllTracks } from '../utils';

export function useScreenRecording() {
  const { setPermission, setStreams, screenStream, systemAudioEnabled } = useRecorderStore();

  const startScreenCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          // Do NOT set width/height ideals — they can force the browser to
          // downscale the capture. Let the browser deliver native resolution.
          frameRate: { ideal: 60, max: 60 },
          cursor: 'always',
        },
        audio: systemAudioEnabled
          ? {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              sampleRate: 48000,
            }
          : false,
        // Chromium-specific hints
        selfBrowserSurface: 'exclude',
        surfaceSwitching: 'include',
        systemAudio: systemAudioEnabled ? 'include' : 'exclude',
      });

      setStreams({ screenStream: stream });
      setPermission('screen', PERMISSION_STATE.GRANTED);
      return stream;
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setPermission('screen', PERMISSION_STATE.CANCELLED);
        throw new Error('Screen sharing was cancelled or denied.');
      }
      if (err.name === 'NotFoundError') {
        setPermission('screen', PERMISSION_STATE.NOT_FOUND);
        throw new Error('No screen source found.');
      }
      throw err;
    }
  }, [setPermission, setStreams, systemAudioEnabled]);

  const stopScreenCapture = useCallback(() => {
    stopAllTracks(screenStream);
    setStreams({ screenStream: null });
  }, [screenStream, setStreams]);

  return { screenStream, startScreenCapture, stopScreenCapture };
}
