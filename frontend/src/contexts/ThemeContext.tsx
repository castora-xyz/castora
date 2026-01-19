import { modal } from '@reown/appkit/react';

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

export type ThemeMode = 'Dark Theme' | 'Light Theme' | 'System Mode';

export const themes: ThemeMode[] = ['Dark Theme', 'Light Theme', 'System Mode'];

const isThemeMode = (value: any): value is ThemeMode => themes.includes(value);

interface ThemeContextProps {
  isDarkDisplay: boolean;
  setTheme: (value: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  isDarkDisplay: false,
  setTheme: () => {}
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkDisplay, setIsDarkDisplay] = useState<boolean>(false);
  const [mode, setMode] = useState<ThemeMode>('System Mode');

  const setDark = () => {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    modal?.setThemeMode('dark');
    setIsDarkDisplay(true);
    const themeLink = document.querySelector('#theme-link') as HTMLLinkElement;
    if (themeLink) themeLink.href = themeLink.href.replace('light', 'dark');
  };

  const setLight = () => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    modal?.setThemeMode('light');
    setIsDarkDisplay(false);
    const themeLink = document.querySelector('#theme-link') as HTMLLinkElement;
    if (themeLink) themeLink.href = themeLink.href.replace('dark', 'light');
  };

  const propagate = (mode: ThemeMode) => {
    if (mode == 'Dark Theme') {
      setDark();
    } else if (mode == 'Light Theme') {
      setLight();
    } else if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      setDark();
    } else {
      setLight();
    }
  };

  const setTheme = (value: ThemeMode) => {
    setMode(value);
    localStorage.setItem('castora::theme', value);
    propagate(value);
  };

  useEffect(() => {
    const saved = localStorage.getItem('castora::theme');
    if (saved && isThemeMode(saved)) setMode(saved);

    propagate((saved as ThemeMode) || 'System Mode');

    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        if (mode == 'System Mode') propagate('System Mode');
      });

    window.addEventListener('storage', () => {
      const saved = localStorage.getItem('castora::theme');
      if (saved && isThemeMode(saved)) {
        setMode(saved);
        propagate(saved);
      }
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkDisplay, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
