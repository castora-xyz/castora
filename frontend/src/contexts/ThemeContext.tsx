import { useWeb3ModalTheme } from '@web3modal/wagmi/react';
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
  const { setThemeMode } = useWeb3ModalTheme();
  const [isDarkDisplay, setIsDarkDisplay] = useState<boolean>(false);
  const [mode, setMode] = useState<ThemeMode>('System Mode');

  const setDark = () => {
    document.body.classList.add('dark');
    setThemeMode('dark');
    setIsDarkDisplay(true);
    const themeLink = document.querySelector('#theme-link') as HTMLLinkElement;
    if (themeLink) themeLink.href = themeLink.href.replace('light', 'dark');
  };

  const setLight = () => {
    document.body.classList.remove('dark');
    setThemeMode('light');
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
