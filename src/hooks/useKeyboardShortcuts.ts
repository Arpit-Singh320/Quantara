import { useState, useEffect, useCallback } from 'react';

export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + K
      if (modifier && e.key === 'k') {
        e.preventDefault();
        shortcuts['cmd+k']?.();
      }

      // Escape
      if (e.key === 'Escape') {
        shortcuts['escape']?.();
      }

      // Cmd/Ctrl + /
      if (modifier && e.key === '/') {
        e.preventDefault();
        shortcuts['cmd+/']?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
