import ChevronDown from '@/assets/chevron-down.svg?react';
import DarkMode from '@/assets/dark-mode.svg?react';
import LightMode from '@/assets/light-mode.svg?react';
import { themes, useFirebase, useTheme } from '@/contexts';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Ripple } from 'primereact/ripple';

export const ToggleThemeButton = () => {
  const { recordEvent } = useFirebase();
  const { isDarkDisplay, setTheme } = useTheme();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex px-3 py-2 rounded-full items-center border border-border-default dark:border-surface-subtle text-sm xl:text-base p-ripple">
          <Ripple />

          {isDarkDisplay ? (
            <LightMode className="w-5 h-5 sm:w-6 sm:h-6 sm:mr-2 md:mr-0 lg:mr-2 lg:w-6 lg:h-6 fill-text-subtitle" />
          ) : (
            <DarkMode className="w-5 h-5 sm:w-6 sm:h-6 sm:mr-2 md:mr-0 lg:mr-2 lg:w-6 lg:h-6 fill-text-subtitle" />
          )}
          <span className="hidden lg:inline" id='theme-toggle-text'>Theme</span>
          <ChevronDown className="ml-1 w-4 h-4 sm:w-5 sm:h-5 fill-text-body" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="p-2 border border-border-default dark:border-surface-subtle outline-none mr-4 rounded z-20 bg-app-bg cursor-pointer"
          sideOffset={16}
        >
          {themes.map((theme) => (
            <DropdownMenu.Item
              key={theme}
              onSelect={() => {
                setTheme(theme);
                recordEvent('changed_theme', theme);
              }}
              title={theme}
              className="p-ripple"
            >
              <Ripple />
              <div className="m-2 rounded-md">{theme}</div>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
