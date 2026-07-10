import { Upload, Check, Loader2 } from 'lucide-react';
import { useRecorderStore } from '../../context/recorderStore';
import { useUpload } from '../../hooks/useUpload';
import { RECORDING_STATE } from '../../constants';
import { clsx } from 'clsx';

export function UploadButton({ title }) {
  const { recordingState, uploadProgress } = useRecorderStore();
  const { upload } = useUpload();

  const isUploading = recordingState === RECORDING_STATE.UPLOADING;
  const isUploaded = recordingState === RECORDING_STATE.UPLOADED;

  if (isUploaded) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-medium">
        <Check size={15} />
        Uploaded
      </div>
    );
  }

  if (isUploading) {
    return (
      <div className="flex flex-col gap-1.5 min-w-[160px]">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Loader2 size={14} className="animate-spin text-purple-400" />
          <span>Uploading… {uploadProgress}%</span>
        </div>
        <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
        <p className="text-xs text-zinc-600">Mock upload — replace with Cloudflare API</p>
      </div>
    );
  }

  return (
    <button
      onClick={() => upload(title)}
      className={clsx(
        'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
        'bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/30 shadow-lg shadow-purple-900/30',
        'active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60'
      )}
    >
      <Upload size={15} />
      Upload video
    </button>
  );
}
