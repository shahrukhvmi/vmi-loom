/**
 * usePermissions
 *
 * Queries and tracks browser permission states for camera and microphone.
 * Screen capture permissions are handled at request time (no queryable state).
 */

import { useEffect, useCallback } from 'react';
import { useRecorderStore } from '../context/recorderStore';
import { PERMISSION_STATE } from '../constants';

function mapState(state) {
  switch (state) {
    case 'granted': return PERMISSION_STATE.GRANTED;
    case 'denied': return PERMISSION_STATE.DENIED;
    default: return PERMISSION_STATE.UNKNOWN;
  }
}

export function usePermissions() {
  const { permissions, setPermission } = useRecorderStore();

  const queryPermission = useCallback(async (name, storeKey) => {
    if (!navigator.permissions) return;
    try {
      const status = await navigator.permissions.query({ name });
      setPermission(storeKey, mapState(status.state));
      status.onchange = () => setPermission(storeKey, mapState(status.state));
    } catch {
      // Some browsers don't support querying camera/mic permissions
    }
  }, [setPermission]);

  useEffect(() => {
    queryPermission('camera', 'camera');
    queryPermission('microphone', 'microphone');
  }, [queryPermission]);

  return { permissions };
}
