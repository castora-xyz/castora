import ChevronDown from '@/assets/chevron-down.svg?react';
import DarkMode from '@/assets/dark-mode.svg?react';
import LightMode from '@/assets/light-mode.svg?react';
import Wallet from '@/assets/wallet.svg?react';
import { themes, useFirebase, useTheme } from '@/contexts';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Ripple } from 'primereact/ripple';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import Castora from '/assets/castora.png';

export const Header = () => {
  const { isConnected, address } = useAccount();
  const { recordEvent } = useFirebase();
  const { isDarkDisplay, setTheme } = useTheme();
  const { open: connectWallet } = useWeb3Modal();
  const location = useLocation();

  const shorten = (str: string) => {
    if (str.length < 10) return str;
    return str.substring(0, 5) + '...' + str.split('').reverse().slice(0, 5).reverse().join('');
  };

  return (
    <header className="max-[414px]:px-4 xs:px-8 py-4 fixed top-0 left-0 right-0 z-10 border-b border-border-default dark:border-surface-subtle bg-app-bg h-16 sm:h-[72px]">
      <div className="flex items-center max-w-screen-xl mx-auto">
        <h1 className="text-text-titles text-xl font-medium sm:text-2xl  md:font-bold grow mr-4">
          <Link to="/">
            <img src={Castora} alt="Castora" className="w-6 xs:w-8 md:w-10" />
          </Link>
        </h1>

        <nav className="max-md:hidden grow flex items-center font-medium lg:text-lg">
          <NavLink
            to="/pools"
            className={({ isActive }) =>
              'p-ripple py-1 px-4 lg:px-6 rounded-full ' +
              `${isActive ? 'text-primary-darker dark:text-primary-default' : ''}`
            }
          >
            Pools
            <Ripple />
          </NavLink>
          <NavLink
            to="/stocks"
            className={({ isActive }) =>
              'p-ripple py-1 px-4 lg:px-6 rounded-full ' +
              `${isActive ? 'text-primary-darker dark:text-primary-default' : ''}`
            }
          >
            Stocks
            <Ripple />
          </NavLink>
          <NavLink
            to="/leaderboard"
            className={({ isActive }) =>
              'p-ripple py-1 px-4 lg:px-6 rounded-full ' +
              `${isActive ? 'text-primary-darker dark:text-primary-default' : ''}`
            }
          >
            Leaderboard
            <Ripple />
          </NavLink>
          <NavLink
            to="/activity"
            className={({ isActive }) =>
              'p-ripple py-1 px-4 lg:px-6 rounded-full  ' +
              `${
                isActive || location.pathname.includes('predictions')
                  ? 'text-primary-darker dark:text-primary-default'
                  : ''
              }`
            }
          >
            <span className="max-lg:hidden">My </span>
            Activity
            <Ripple />
          </NavLink>
        </nav>

        <button
          className="flex mr-4 px-4 py-2 rounded-full items-center border border-border-default dark:border-surface-subtle text-sm md:text-base p-ripple"
          onClick={() => connectWallet()}
        >
          <Ripple />
          {isConnected ? (
            <>
              <>{address && shorten(address)}</>
              <ChevronDown className="ml-2 w-4 h-4 sm:w-5 sm:h-5 fill-text-body" />
            </>
          ) : (
            <>
              <Wallet className="mr-2 w-4 h-4 sm:w-5 sm:h-5 stroke-text-body" />
              <span className="font-medium">Connect</span>
              <span className="hidden xs:inline font-medium">&nbsp;Wallet</span>
            </>
          )}
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className={
                'p-ripple p-1 md:p-1.5 rounded-full bg-surface-subtle ' +
                `${isDarkDisplay ? 'pl-6 md:pl-8' : 'pr-6 md:pr-8'}`
              }
            >
              <Ripple />
              <div className="p-1.5 md:p-2 bg-app-bg rounded-full">
                {isDarkDisplay ? (
                  <DarkMode className="w-4 h-4 fill-text-subtitle" />
                ) : (
                  <LightMode className="w-4 h-4 fill-text-subtitle" />
                )}
              </div>
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
      </div>
    </header>
  );
};
