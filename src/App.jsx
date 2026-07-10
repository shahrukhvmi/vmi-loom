import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useRecorderStore } from "./context/recorderStore";
import { useAuthStore } from "./context/authStore";
import { setAuthInterceptor } from "./services/authService";
import { usePermissions } from "./hooks/usePermissions";
import { AuthPage } from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { PreviewPage } from "./pages/PreviewPage";
import { RecordingLauncher } from "./components/launcher/RecordingLauncher";
import { RecordingControls } from "./components/controls/RecordingControls";
import { CameraPreview } from "./components/controls/CameraPreview";
import { ScreenshotPreviewModal } from "./components/screenshot/ScreenshotPreviewModal";
import { RECORDING_STATE } from "./constants";

// Wire interceptor once — reads token from Zustand store on every request
setAuthInterceptor(() => useAuthStore.getState().token);

export default function App() {
  usePermissions();
  const { recordingState } = useRecorderStore();
  const { token } = useAuthStore();

  const isPreview =
    recordingState === RECORDING_STATE.PREVIEW ||
    recordingState === RECORDING_STATE.UPLOADING ||
    recordingState === RECORDING_STATE.UPLOADED;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#1a1a2e",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "500",
            borderRadius: "12px",
            padding: "12px 16px",
            boxShadow: "0 8px 24px rgba(0,0,0,.15)",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />

      {!token ? <AuthPage /> : isPreview ? <PreviewPage /> : <HomePage />}

      <RecordingLauncher />
      <RecordingControls />
      <CameraPreview />
      <ScreenshotPreviewModal />
    </>
  );
}
