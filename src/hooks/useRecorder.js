import { useCallback, useRef } from "react";
import { useRecorderStore } from "../context/recorderStore";
import { useScreenRecording } from "./useScreenRecording";
import { useCamera } from "./useCamera";
import { useMicrophone } from "./useMicrophone";
import { createCompositeStream } from "../services/recordingService";
import { RECORDING_STATE, RECORDING_MODE } from "../constants";
import { stopAllTracks, getStreamResolution } from "../utils";

// ── Module-level singletons ────────────────────────────────────────────────
// These live OUTSIDE the hook so all hook instances share the same refs.
// This fixes the bug where RecordingLauncher and RecordingControls each got
// their own hook instance with their own (empty) recorderRef.
const _recorder = { current: null };
const _chunks = { current: [] };
const _mime = { current: "" };
const _finalized = { current: false };
const _streams = {
  current: {
    screenStream: null,
    cameraStream: null,
    micStream: null,
    compositeCleanup: null,
  },
};
const _timer = { current: null };
const _count = { current: 0 };
const _stopFn = { current: null }; // stable ref for 'ended' event listener

// ─────────────────────────────────────────────────────────────────────────────

export function useRecorder() {
  const store = useRecorderStore();
  const { startScreenCapture } = useScreenRecording();
  const { startCamera } = useCamera();
  const { startMicrophone } = useMicrophone();

  // ── Timer ───────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    _count.current = 0;
    store.setElapsedSeconds(0);
    clearInterval(_timer.current);
    _timer.current = setInterval(() => {
      _count.current += 1;
      store.setElapsedSeconds(_count.current);
    }, 1000);
  }, [store]);

  const stopTimer = useCallback(() => {
    clearInterval(_timer.current);
    _timer.current = null;
  }, []);

  // ── Finalize ─────────────────────────────────────────────────────────────
  const finalizeRecording = useCallback(() => {
    if (_finalized.current) return;
    _finalized.current = true;

    const { screenStream, cameraStream, micStream, compositeCleanup } =
      _streams.current;
    const storeState = useRecorderStore.getState();

    if (compositeCleanup) {
      // Screen+Camera mode: cleanup() handles stopping screen+camera+mic tracks
      compositeCleanup();
    } else {
      // Screen-only or Camera-only: stop all streams directly
      [
        screenStream,
        cameraStream,
        micStream,
        storeState.screenStream,
        storeState.cameraStream,
        storeState.micStream,
        storeState.combinedStream,
      ].forEach((stream) => {
        if (!stream) return;
        stream.getTracks().forEach((t) => t.stop());
      });
    }

    const mime = _mime.current || "video/webm";
    const blob = new Blob(_chunks.current, { type: mime });
    const url = URL.createObjectURL(blob);

    console.log(
      "[finalize] chunks:",
      _chunks.current.length,
      "size:",
      blob.size,
      "mime:",
      mime,
    );

    store.setRecordedOutput({
      blob,
      url,
      mimeType: mime,
      resolution: storeState.recordingResolution,
    });
    store.setRecordingState(RECORDING_STATE.PREVIEW);
  }, [store]);

  // ── Stop ─────────────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    const state = useRecorderStore.getState().recordingState;
    if (state !== RECORDING_STATE.RECORDING && state !== RECORDING_STATE.PAUSED)
      return;

    stopTimer();
    store.setRecordingState(RECORDING_STATE.STOPPED);

    const mr = _recorder.current;
    console.log("[stopRecording] mr:", mr, "state:", mr?.state);

    if (mr && mr.state !== "inactive") {
      mr.stop(); // triggers onstop → finalizeRecording
    } else {
      finalizeRecording();
    }
  }, [stopTimer, store, finalizeRecording]);

  _stopFn.current = stopRecording;

  // ── Start ─────────────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    // Reset all singletons for new session
    _finalized.current = false;
    _recorder.current = null;
    _chunks.current = [];
    _mime.current = "";
    _streams.current = {
      screenStream: null,
      cameraStream: null,
      micStream: null,
      compositeCleanup: null,
    };

    store.setRecordingState(RECORDING_STATE.REQUESTING);
    store.clearError();

    try {
      const { mode, micEnabled, cameraEnabled } = store;
      let screenStream = null;
      let cameraStream = null;
      let micStream = null;

      if (
        mode === RECORDING_MODE.SCREEN ||
        mode === RECORDING_MODE.SCREEN_CAMERA
      ) {
        screenStream = await startScreenCapture();
        screenStream.getVideoTracks()[0]?.addEventListener("ended", () => {
          _stopFn.current?.();
        });
      }

      const needCamera =
        mode === RECORDING_MODE.SCREEN_CAMERA || mode === RECORDING_MODE.CAMERA; // always acquire camera in CAMERA mode

      if (needCamera) cameraStream = await startCamera();
      if (micEnabled) micStream = await startMicrophone();

      _streams.current = {
        screenStream,
        cameraStream,
        micStream,
        compositeCleanup: null,
      };

      let recordStream;

      if (
        mode === RECORDING_MODE.SCREEN_CAMERA &&
        screenStream &&
        cameraStream
      ) {
        const { combinedStream, cleanup } = await createCompositeStream(
          screenStream,
          cameraStream,
          micStream,
        );
        recordStream = combinedStream;
        _streams.current.compositeCleanup = cleanup;
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
        throw new Error("No valid stream combination available.");
      }

      store.setStreams({ screenStream, cameraStream, micStream });
      const resolution =
        getStreamResolution(screenStream) ||
        getStreamResolution(cameraStream) ||
        getStreamResolution(recordStream);
      store.setStreams({ recordingResolution: resolution });

      // ── Build MediaRecorder ──────────────────────────────────────────────
      const MIME_TYPES = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
      ];
      const bestMime =
        MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || "";
      const mr = bestMime
        ? new MediaRecorder(recordStream, { mimeType: bestMime })
        : new MediaRecorder(recordStream);

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) _chunks.current.push(e.data);
      };

      mr.onstop = () => {
        console.log("[onstop] chunks:", _chunks.current.length);
        finalizeRecording();
      };

      _mime.current = mr.mimeType || bestMime || "video/webm";
      _recorder.current = mr;
      store.setMediaRecorder(mr);

      mr.start(250);
      console.log(
        "[startRecording] started, state:",
        mr.state,
        "mime:",
        mr.mimeType,
      );

      store.setRecordingState(RECORDING_STATE.RECORDING);
      store.setIsPaused(false);
      startTimer();
    } catch (err) {
      console.error("[useRecorder] error:", err);
      store.setError(err.message || "Failed to start recording.");
      store.setRecordingState(RECORDING_STATE.IDLE);
      store.openLauncher();
    }
  }, [
    store,
    startScreenCapture,
    startCamera,
    startMicrophone,
    startTimer,
    finalizeRecording,
  ]);

  // ── Pause ────────────────────────────────────────────────────────────────
  const pauseRecording = useCallback(() => {
    if (store.recordingState !== RECORDING_STATE.RECORDING) return;
    try {
      _recorder.current?.pause();
      store.setRecordingState(RECORDING_STATE.PAUSED);
      store.setIsPaused(true);
      stopTimer();
    } catch (e) {
      console.error("Pause failed:", e);
    }
  }, [store, stopTimer]);

  // ── Resume ───────────────────────────────────────────────────────────────
  const resumeRecording = useCallback(() => {
    if (store.recordingState !== RECORDING_STATE.PAUSED) return;
    try {
      _recorder.current?.resume();
      store.setRecordingState(RECORDING_STATE.RECORDING);
      store.setIsPaused(false);
      startTimer();
    } catch (e) {
      console.error("Resume failed:", e);
    }
  }, [store, startTimer]);

  // ── Cancel ───────────────────────────────────────────────────────────────
  const cancelRecording = useCallback(() => {
    _finalized.current = true;
    stopTimer();
    const mr = _recorder.current;
    try {
      if (mr && mr.state !== "inactive") mr.stop();
    } catch {}
    const { screenStream, cameraStream, micStream, compositeCleanup } =
      _streams.current;
    compositeCleanup?.();
    stopAllTracks(screenStream);
    stopAllTracks(cameraStream);
    stopAllTracks(micStream);
    _chunks.current = [];
    _recorder.current = null;
    store.reset();
  }, [store, stopTimer]);

  return {
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  };
}
