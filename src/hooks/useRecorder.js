/**
 * useRecorder
 *
 * Orchestrates the full recording lifecycle.
 *
 * FIX: createCompositeStream is now async (waits for video frames before
 * sizing canvas). All callers must await it.
 *
 * FIX: SCREEN_CAMERA always acquires camera regardless of cameraEnabled toggle.
 * The toggle only applies to CAMERA-only mode.
 *
 * FIX: On error, re-open launcher so the user sees the error message.
 *
 * FIX: stopRecording is stored in a ref so the 'ended' event listener on the
 * screen track always calls the latest version (avoids stale closure).
 */

import { useCallback, useRef } from 'react';
import { useRecorderStore } from '../context/recorderStore';
import { useScreenRecording } from './useScreenRecording';
import { useCamera } from './useCamera';
import { useMicrophone } from './useMicrophone';
import { createMediaRecorder, createCompositeStream } from '../services/recordingService';
import { RECORDING_STATE, RECORDING_MODE } from '../constants';
import { stopAllTracks, getStreamResolution } from '../utils';

export function useRecorder() {
  const store = useRecorderStore();
  const { startScreenCapture } = useScreenRecording();
  const { startCamera } = useCamera();
  const { startMicrophone } = useMicrophone();

  const chunksRef   = useRef([]);
  const timerRef    = useRef(null);
  const countRef    = useRef(0);
  const mimeTypeRef = useRef('');
  const stopRef     = useRef(null); // stable ref so event listeners don't go stale

  // ── Timer ────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    countRef.current = 0;
    store.setElapsedSeconds(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      countRef.current += 1;
      store.setElapsedSeconds(countRef.current);
    }, 1000);
  }, [store]);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // ── Finalize (called by MediaRecorder onstop) ────────────────────────────
  const finalizeRecording = useCallback((mimeType) => {
    const { screenStream, cameraStream, micStream, compositeCleanup } = store;

    compositeCleanup?.();
    stopAllTracks(screenStream);
    stopAllTracks(cameraStream);
    stopAllTracks(micStream);

    const effectiveMime = mimeType || mimeTypeRef.current || 'video/webm';
    const blob = new Blob(chunksRef.current, { type: effectiveMime });
    const url  = URL.createObjectURL(blob);

    store.setRecordedOutput({
      blob,
      url,
      mimeType: effectiveMime,
      resolution: store.recordingResolution,
    });
    store.setRecordingState(RECORDING_STATE.PREVIEW);
  }, [store]);

  // ── Stop ─────────────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    const { mediaRecorder, recordingState } = store;
    if (
      recordingState !== RECORDING_STATE.RECORDING &&
      recordingState !== RECORDING_STATE.PAUSED
    ) return;

    stopTimer();
    mediaRecorder?.stop();
    store.setRecordingState(RECORDING_STATE.STOPPED);
  }, [store, stopTimer]);

  // Keep stopRef current so the track-ended listener always sees latest fn
  stopRef.current = stopRecording;

  // ── Start ─────────────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    store.setRecordingState(RECORDING_STATE.REQUESTING);
    store.clearError();
    chunksRef.current = [];

    try {
      const { mode, micEnabled, cameraEnabled } = store;
      let screenStream = null;
      let cameraStream = null;
      let micStream    = null;

      // ── Acquire streams ──────────────────────────────────────────────────
      if (mode === RECORDING_MODE.SCREEN || mode === RECORDING_MODE.SCREEN_CAMERA) {
        screenStream = await startScreenCapture();

        // When user clicks "Stop sharing" in the browser toolbar
        screenStream.getVideoTracks()[0]?.addEventListener('ended', () => {
          stopRef.current?.();
        });
      }

      // Camera:
      //  • CAMERA mode       — respect cameraEnabled toggle
      //  • SCREEN_CAMERA     — always acquire (overlay always needs it)
      const needCamera =
        mode === RECORDING_MODE.SCREEN_CAMERA ||
        (mode === RECORDING_MODE.CAMERA && cameraEnabled);

      if (needCamera) {
        cameraStream = await startCamera();
      }

      if (micEnabled) {
        micStream = await startMicrophone();
      }

      // ── Build record stream ──────────────────────────────────────────────
      let recordStream;
      let compositeCleanup = null;

      if (mode === RECORDING_MODE.SCREEN_CAMERA && screenStream && cameraStream) {
        // createCompositeStream is async — must await
        const { combinedStream, cleanup } = await createCompositeStream(
          screenStream,
          cameraStream,
          micStream
        );
        recordStream     = combinedStream;
        compositeCleanup = cleanup;
        store.setStreams({ combinedStream });

      } else if (mode === RECORDING_MODE.SCREEN && screenStream) {
        recordStream = new MediaStream([
          ...screenStream.getTracks(),
          ...(micStream?.getAudioTracks() || []),
        ]);

      } else if (mode === RECORDING_MODE.CAMERA && cameraStream) {
        recordStream = new MediaStream([
          ...cameraStream.getVideoTracks(),
          ...(micStream?.getAudioTracks() || []),
        ]);

      } else {
        throw new Error('No valid stream combination available.');
      }

      if (compositeCleanup) store.setCompositeCleanup(compositeCleanup);

      // Resolution from actual video track (more reliable post-await)
      const resolution =
        getStreamResolution(screenStream) ||
        getStreamResolution(cameraStream)  ||
        getStreamResolution(recordStream);
      store.setStreams({ recordingResolution: resolution });

      // ── MediaRecorder ────────────────────────────────────────────────────
      const recorder = createMediaRecorder(
        recordStream,
        (chunk) => chunksRef.current.push(chunk),
        () => finalizeRecording(recorder.mimeType)
      );

      mimeTypeRef.current = recorder.mimeType;
      store.setMediaRecorder(recorder);
      recorder.start(250); // 250ms chunks for smoother progress

      store.setRecordingState(RECORDING_STATE.RECORDING);
      store.setIsPaused(false);
      startTimer();

    } catch (err) {
      console.error('[useRecorder] startRecording error:', err);
      store.setError(err.message || 'Failed to start recording.');
      store.setRecordingState(RECORDING_STATE.IDLE);
      store.openLauncher(); // show error in launcher
    }
  }, [store, startScreenCapture, startCamera, startMicrophone, startTimer, finalizeRecording]);

  // ── Pause ─────────────────────────────────────────────────────────────────
  const pauseRecording = useCallback(() => {
    if (store.recordingState !== RECORDING_STATE.RECORDING) return;
    try {
      store.mediaRecorder?.pause();
      store.setRecordingState(RECORDING_STATE.PAUSED);
      store.setIsPaused(true);
      stopTimer();
    } catch (e) {
      console.error('Pause failed:', e);
    }
  }, [store, stopTimer]);

  // ── Resume ────────────────────────────────────────────────────────────────
  const resumeRecording = useCallback(() => {
    if (store.recordingState !== RECORDING_STATE.PAUSED) return;
    try {
      store.mediaRecorder?.resume();
      store.setRecordingState(RECORDING_STATE.RECORDING);
      store.setIsPaused(false);
      startTimer();
    } catch (e) {
      console.error('Resume failed:', e);
    }
  }, [store, startTimer]);

  // ── Cancel ────────────────────────────────────────────────────────────────
  const cancelRecording = useCallback(() => {
    const { mediaRecorder, screenStream, cameraStream, micStream, compositeCleanup } = store;
    stopTimer();
    try { mediaRecorder?.stop(); } catch {}
    compositeCleanup?.();
    stopAllTracks(screenStream);
    stopAllTracks(cameraStream);
    stopAllTracks(micStream);
    chunksRef.current = [];
    store.reset();
  }, [store, stopTimer]);

  return { startRecording, pauseRecording, resumeRecording, stopRecording, cancelRecording };
}
