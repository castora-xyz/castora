import { Ripple } from 'primereact/ripple';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ConnectWalletButton } from './ConnectWalletButton';
import { TelegramNotificationsButton } from './TelegramNotificationButton';
import { ToggleThemeButton } from './ToggleThemeButton';
import Castora from '/assets/castora.png';

export const Header = () => {
  const location = useLocation();

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
              `${isActive || location.pathname.includes('pools') || location.pathname.includes('stocks') || location.pathname.includes('community') ? 'text-primary-darker dark:text-primary-default' : ''}`
            }
          >
            Pools
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
                isActive || location.pathname.includes('activity') || location.pathname.includes('predictions')
                  ? 'text-primary-darker dark:text-primary-default'
                  : ''
              }`
            }
          >
            <span className="max-xl:hidden">My </span>
            Activity
            <Ripple />
          </NavLink>
        </nav>

        <ConnectWalletButton />

        <TelegramNotificationsButton />

        <ToggleThemeButton />
      </div>
    </header>
  );
};
