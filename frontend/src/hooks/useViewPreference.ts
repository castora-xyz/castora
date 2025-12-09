import { useState, useEffect } from 'react';

export type ViewType = 'grid' | 'table';

export const useViewPreference = (key: string, defaultValue: ViewType = 'grid'): [ViewType, (view: ViewType) => void] => {
  const [view, setView] = useState<ViewType>(() => {
    const stored = localStorage.getItem(key);
    return (stored as ViewType) || defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, view);
  }, [key, view]);

  return [view, setView];
};

