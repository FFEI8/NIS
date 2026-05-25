'use client';

import { useState, useEffect, useCallback } from 'react';

export function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('hims-dark-mode');
    if (saved === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);
  const toggle = useCallback(() => {
    setDark(prev => {
      const next = !prev;
      localStorage.setItem('hims-dark-mode', String(next));
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return next;
    });
  }, []);
  return { dark, toggle };
}
