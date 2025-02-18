import Leaderboard from '@/assets/leaderboard.svg?react';
import RectangleStack from '@/assets/rectangle-stack.svg?react';
import Squares2x2 from '@/assets/squares-2x2.svg?react';
import { Ripple } from 'primereact/ripple';
import { NavLink, useLocation } from 'react-router-dom';

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav
      id="bottom-nav"
      className="hidden max-[600px]:block py-2 fixed bottom-0 left-0 right-0 z-10 border-t border-border-default dark:border-surface-subtle bg-app-bg font-medium text-sm md:text-base"
    >
      <ul className="flex justify-evenly items-center max-w-lg mx-auto">
        <li>
          <NavLink
            to="/pools"
            className={({ isActive }) =>
              'p-ripple py-2 px-5 rounded-md flex flex-col justify-center items-center ' +
              `${
                isActive || location.pathname.includes('pool')
                  ? 'text-primary-darker stroke-primary-darker dark:text-primary-default dark:stroke-primary-default'
                  : 'text-text-subtitle stroke-text-subtitle'
              }`
            }
          >
            <RectangleStack className="w-6 h-6" />
            <span>Pools</span>
            <Ripple />
          </NavLink>
        </li>
        {/* <li>
          <NavLink
            to="/predictions"
            className={({ isActive }) =>
              'p-ripple p-2 rounded-md flex flex-col justify-center items-center ' +
              `${
                isActive
                  ? 'text-primary-darker stroke-primary-darker dark:text-primary-default dark:stroke-primary-default'
                  : 'text-text-subtitle stroke-text-subtitle'
              }`
            }
          >
            <Briefcase className="w-6 h-6" />
            <span>Predictions</span>
            <Ripple />
          </NavLink>
        </li> */}
        <li>
          <NavLink
            to="/leaderboard"
            className={({ isActive }) =>
              'p-ripple p-2 rounded-md flex flex-col justify-center items-center ' +
              `${
                isActive
                  ? 'text-primary-darker stroke-primary-darker dark:text-primary-default dark:stroke-primary-default'
                  : 'text-text-subtitle stroke-text-subtitle'
              }`
            }
          >
            <Leaderboard className="w-6 h-6" />
            <span>Leaderboard</span>
            <Ripple />
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/activity"
            className={({ isActive }) =>
              'p-ripple py-2 px-4 rounded-md flex flex-col justify-center items-center ' +
              `${
                isActive
                  ? 'text-primary-darker stroke-primary-darker dark:text-primary-default dark:stroke-primary-default'
                  : 'text-text-subtitle stroke-text-subtitle'
              }`
            }
          >
            <Squares2x2 className="w-6 h-6" />
            <span>Activity</span>
            <Ripple />
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};
