import { Ripple } from 'primereact/ripple';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ConnectWalletButton } from './ConnectWalletButton';
import { MyActivityPagesMenu } from './MyActivityPagesMenu';
import { PoolsPagesMenu } from './PoolsPagesMenu';
import { TelegramNotificationsButton } from './TelegramNotificationButton';
import { ToggleThemeButton } from './ToggleThemeButton';
import Castora from '/assets/castora.png';

export const Header = () => {
  const location = useLocation();

  return (
    <header className="max-[414px]:px-4 xs:px-8 py-4 fixed top-0 left-0 right-0 z-30 border-b border-border-default dark:border-surface-subtle bg-app-bg h-16 sm:h-[72px]">
      <div className="flex items-center max-w-screen-xl mx-auto">
        <h1 className="text-text-titles text-xl font-medium sm:text-2xl  md:font-bold grow mr-4">
          <Link to="/">
            <img src={Castora} alt="Castora" className="w-6 xs:w-8 md:w-10" />
          </Link>
        </h1>

        <nav className="max-md:hidden grow flex items-center font-medium lg:text-lg">
          <PoolsPagesMenu placement="header">
            <button
              className={
                'p-ripple py-1 px-4 lg:px-6 rounded-full ' +
                `${location.pathname.includes('/pools') ? 'text-primary-darker dark:text-primary-default' : ''}`
              }
            >
              Pools
              <Ripple />
            </button>
          </PoolsPagesMenu>
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
          <MyActivityPagesMenu placement="header">
            <button
              className={
                'p-ripple py-1 px-4 lg:px-6 rounded-full  ' +
                `${location.pathname.includes('/activity') ? 'text-primary-darker dark:text-primary-default' : ''}`
              }
            >
              <span className="max-xl:hidden">My </span>
              Activity
              <Ripple />
            </button>
          </MyActivityPagesMenu>
        </nav>

        <ConnectWalletButton />

        <TelegramNotificationsButton />

        <ToggleThemeButton />
      </div>
    </header>
  );
};
