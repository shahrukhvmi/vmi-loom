import { useRecorderStore } from './context/recorderStore';
import { usePermissions } from './hooks/usePermissions';
import { HomePage } from './pages/HomePage';
import { PreviewPage } from './pages/PreviewPage';
import { RecordingLauncher } from './components/launcher/RecordingLauncher';
import { RecordingControls } from './components/controls/RecordingControls';
import { CameraPreview } from './components/controls/CameraPreview';
import { ScreenshotPreviewModal } from './components/screenshot/ScreenshotPreviewModal';
import { RECORDING_STATE } from './constants';

export default function App() {
  usePermissions();
  const { recordingState } = useRecorderStore();

  const isPreview =
    recordingState === RECORDING_STATE.PREVIEW   ||
    recordingState === RECORDING_STATE.UPLOADING ||
    recordingState === RECORDING_STATE.UPLOADED;

  return (
    <>
      {isPreview ? <PreviewPage /> : <HomePage />}
      <RecordingLauncher />
      <RecordingControls />
      <CameraPreview />
      <ScreenshotPreviewModal />
    </>
  );
}
