import ChevronDown from '@/assets/chevron-down.svg?react';
import DarkMode from '@/assets/dark-mode.svg?react';
import LightMode from '@/assets/light-mode.svg?react';
import { themes, useFirebase, useTheme } from '@/contexts';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Ripple } from 'primereact/ripple';
import { useRef } from 'react';

export const ToggleThemeButton = () => {
  const { recordEvent } = useFirebase();
  const { isDarkDisplay, setTheme } = useTheme();
  const overlayRef = useRef<OverlayPanel>(null);

  return (
    <div key="theme_toggle_button">
      <button
        className="flex px-3 py-2 rounded-full items-center border border-border-default dark:border-surface-subtle text-sm xl:text-base p-ripple"
        onClick={(e) => overlayRef.current?.toggle(e)}
      >
        <Ripple />

        {isDarkDisplay ? (
          <LightMode className="w-5 h-5 sm:w-6 sm:h-6 sm:mr-2 md:mr-0 lg:mr-2 lg:w-6 lg:h-6 fill-text-subtitle" />
        ) : (
          <DarkMode className="w-5 h-5 sm:w-6 sm:h-6 sm:mr-2 md:mr-0 lg:mr-2 lg:w-6 lg:h-6 fill-text-subtitle" />
        )}
        <span className="hidden lg:inline" id="theme-toggle-text">
          Theme
        </span>
        <ChevronDown className="ml-1 w-4 h-4 sm:w-5 sm:h-5 fill-text-body" />
      </button>

      <OverlayPanel
        ref={overlayRef}
        pt={{ root: { className: 'p-0 rounded-lg bg-app-bg' }, content: { className: 'p-0' } }}
        dismissable
      >
        {themes.map((theme) => (
          <button
            key={theme}
            onClick={() => {
              setTheme(theme);
              recordEvent('changed_theme', theme);
              overlayRef.current?.hide();
            }}
            title={theme}
            className="block px-5 py-3 hover:bg-surface-default p-ripple"
          >
            <Ripple />
            <span>{theme}</span>
          </button>
        ))}
      </OverlayPanel>
    </div>
  );
};
