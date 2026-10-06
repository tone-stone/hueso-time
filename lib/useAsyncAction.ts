import { useCallback, useRef, useState } from 'react';
import { showToast } from '@/components/Toast';
import { useTranslation } from 'react-i18next';

/** Keep a failed operation available for an explicit retry; never report false success. */
export function useAsyncAction() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const executing = useRef(false);
  const last = useRef<(() => Promise<unknown>) | null>(null);
  const run = useCallback(async (action: () => Promise<unknown>) => {
    if (executing.current) return false;
    last.current = action;
    executing.current = true;
    setBusy(true);
    setError(null);
    try { await action(); return true; }
    catch (cause) {
      const message = cause instanceof Error ? cause.message : t('ux.saveFailed');
      setError(message);
      showToast(message);
      return false;
    } finally { executing.current = false; setBusy(false); }
  }, [t]);
  const retry = () => { if (last.current) void run(last.current); };
  return { busy, error, run, retry };
}
