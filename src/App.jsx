import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { useRecorderStore } from "./context/recorderStore";
import { useAuthStore } from "./context/authStore";
import { setAuthInterceptor } from "./services/authService";
import { usePermissions } from "./hooks/usePermissions";
import { AuthPage } from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { PreviewPage } from "./pages/PreviewPage";
import { LibraryPage } from "./pages/LibraryPage";
import { SharePage } from "./pages/SharePage";
import { RecordingLauncher } from "./components/launcher/RecordingLauncher";
import { RecordingControls } from "./components/controls/RecordingControls";
import { CameraPreview } from "./components/controls/CameraPreview";
import { ScreenshotPreviewModal } from "./components/screenshot/ScreenshotPreviewModal";
import { RECORDING_STATE } from "./constants";

setAuthInterceptor(() => useAuthStore.getState().token);

function getShareUuid() {
  const match = window.location.pathname.match(/\/share\/([0-9a-f-]{36})/i);
  return match ? match[1] : null;
}

const TOAST_OPTS = {
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
};

export default function App() {
  usePermissions();
  const { recordingState } = useRecorderStore();
  const { token } = useAuthStore();
  const [view, setView] = useState("home"); // 'home' | 'library'
  const [selectedVideo, setSelectedVideo] = useState(null); // server video

  const shareUuid = getShareUuid();

  const isPreview =
    recordingState === RECORDING_STATE.PREVIEW ||
    recordingState === RECORDING_STATE.UPLOADING ||
    recordingState === RECORDING_STATE.UPLOADED;

  if (shareUuid) {
    return (
      <>
        <Toaster position="top-center" toastOptions={TOAST_OPTS} />
        <SharePage shareUuid={shareUuid} />
      </>
    );
  }

  const handleVideoSelect = (video) => {
    setSelectedVideo({ uuid: video.uuid });
    setView("video");
  };

  const handleBackToLibrary = () => {
    setSelectedVideo(null);
    setView("library");
  };

  return (
    <>
      <Toaster position="top-center" toastOptions={TOAST_OPTS} />

      {!token ? (
        <AuthPage />
      ) : isPreview ? (
        <PreviewPage onGoToLibrary={() => setView("library")} />
      ) : view === "library" ? (
        <LibraryPage
          onNewRecording={() => setView("home")}
          onVideoSelect={handleVideoSelect}
        />
      ) : view === "video" && selectedVideo ? (
        <PreviewPage serverVideo={selectedVideo} onBack={handleBackToLibrary} />
      ) : (
        <HomePage onGoToLibrary={() => setView("library")} />
      )}

      <RecordingLauncher />
      <RecordingControls />
      <CameraPreview />
      <ScreenshotPreviewModal />
    </>
  );
}
