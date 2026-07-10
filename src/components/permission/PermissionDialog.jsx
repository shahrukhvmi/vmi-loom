import { Monitor, Camera, Mic, AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { PERMISSION_STATE } from '../../constants';
import { clsx } from 'clsx';

const MESSAGES = {
  [PERMISSION_STATE.DENIED]: {
    icon: <AlertTriangle size={20} className="text-red-400" />,
    title: 'Permission denied',
    color: 'border-red-500/30 bg-red-500/5',
    badgeColor: 'bg-red-500/20 text-red-400',
    action: 'Open Settings',
  },
  [PERMISSION_STATE.BLOCKED]: {
    icon: <AlertTriangle size={20} className="text-orange-400" />,
    title: 'Permission blocked',
    color: 'border-orange-500/30 bg-orange-500/5',
    badgeColor: 'bg-orange-500/20 text-orange-400',
    action: 'Open Settings',
  },
  [PERMISSION_STATE.NOT_FOUND]: {
    icon: <AlertTriangle size={20} className="text-yellow-400" />,
    title: 'Device not found',
    color: 'border-yellow-500/30 bg-yellow-500/5',
    badgeColor: 'bg-yellow-500/20 text-yellow-400',
    action: 'Try again',
  },
  [PERMISSION_STATE.CANCELLED]: {
    icon: <RefreshCw size={20} className="text-zinc-400" />,
    title: 'Cancelled',
    color: 'border-zinc-700 bg-zinc-800/40',
    badgeColor: 'bg-zinc-700 text-zinc-400',
    action: 'Try again',
  },
};

const DEVICE_ICONS = {
  screen: <Monitor size={16} />,
  camera: <Camera size={16} />,
  microphone: <Mic size={16} />,
};

const DEVICE_LABELS = {
  screen: 'Screen',
  camera: 'Camera',
  microphone: 'Microphone',
};

const DEVICE_INSTRUCTIONS = {
  screen: 'Choose what to share in the browser popup, then click "Share".',
  camera: 'Allow camera access when your browser asks, or enable it in your system settings.',
  microphone: 'Allow microphone access when your browser asks, or enable it in your system settings.',
};

export function PermissionError({ deviceKey, permissionState, onRetry, onOpenSettings }) {
  const config = MESSAGES[permissionState];
  if (!config) return null;

  const isBlocked = permissionState === PERMISSION_STATE.DENIED || permissionState === PERMISSION_STATE.BLOCKED;

  return (
    <div className={clsx(
      'rounded-xl border p-4 flex items-start gap-3 animate-fade-in',
      config.color
    )}>
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={clsx('inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md', config.badgeColor)}>
            {DEVICE_ICONS[deviceKey]}
            {DEVICE_LABELS[deviceKey]}
          </span>
          <span className="text-sm font-medium text-white">{config.title}</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {DEVICE_INSTRUCTIONS[deviceKey]}
        </p>
      </div>
      <div className="flex-shrink-0">
        {isBlocked ? (
          <Button
            variant="outline"
            size="xs"
            onClick={onOpenSettings}
            className="gap-1.5"
          >
            <Settings size={12} />
            Settings
          </Button>
        ) : (
          <Button
            variant="outline"
            size="xs"
            onClick={onRetry}
            className="gap-1.5"
          >
            <RefreshCw size={12} />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

export function PermissionStatus({ deviceKey, state }) {
  const isDenied = state === PERMISSION_STATE.DENIED || state === PERMISSION_STATE.BLOCKED;
  const isGranted = state === PERMISSION_STATE.GRANTED;

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border',
      isGranted && 'bg-green-500/10 text-green-400 border-green-500/25',
      isDenied && 'bg-red-500/10 text-red-400 border-red-500/25',
      !isGranted && !isDenied && 'bg-zinc-800 text-zinc-500 border-zinc-700',
    )}>
      <span className={clsx(
        'h-1.5 w-1.5 rounded-full',
        isGranted && 'bg-green-400',
        isDenied && 'bg-red-400',
        !isGranted && !isDenied && 'bg-zinc-600',
      )} />
      {DEVICE_LABELS[deviceKey]}
    </span>
  );
}
