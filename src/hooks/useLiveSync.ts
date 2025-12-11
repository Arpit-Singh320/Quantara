import { useState, useEffect, useCallback } from 'react';

export function useLiveSync(intervalMs: number = 30000) {
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const sync = useCallback(() => {
    setIsSyncing(true);
    // Simulate sync
    setTimeout(() => {
      setLastSync(new Date());
      setIsSyncing(false);
    }, 800);
  }, []);

  useEffect(() => {
    const interval = setInterval(sync, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs, sync]);

  useEffect(() => {
    const updateSeconds = () => {
      setSecondsAgo(Math.floor((Date.now() - lastSync.getTime()) / 1000));
    };
    updateSeconds();
    const interval = setInterval(updateSeconds, 1000);
    return () => clearInterval(interval);
  }, [lastSync]);

  const formatRelativeTime = () => {
    if (secondsAgo < 5) return 'just now';
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const minutes = Math.floor(secondsAgo / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return 'over an hour ago';
  };

  return {
    lastSync,
    isSyncing,
    secondsAgo,
    relativeTime: formatRelativeTime(),
    triggerSync: sync,
  };
}
