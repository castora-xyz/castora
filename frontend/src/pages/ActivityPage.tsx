import Briefcase from '@/assets/briefcase.svg?react';
import Squares2x2 from '@/assets/squares-2x2.svg?react';
import { Ripple } from 'primereact/ripple';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export const ActivityPage = () => {
  useEffect(() => {
    document.title = 'Activity | Castora';
  }, []);

  return (
    <div className="flex flex-col justify-center grow pt-20 md:py-32">
      <div className="w-full max-w-screen-xl mx-auto px-4 xs:px-6">
        <h1 className="text-center text-3xl xs:text-4xl md:text-5xl lg:text-6xl font-bold text-text-title mb-8 md:mb-12">
          My{' '}
          <span className="text-primary-darker dark:text-primary-default">
            Activity
          </span>
        </h1>

        <p className="text-center text-lg md:text-xl mb-12 max-w-2xl mx-auto text-text-subtitle">
          Choose what you want to view from your activity.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* My Predictions */}
          <Link
            to="/activity/predictions"
            className="group p-8 rounded-3xl bg-app-bg border-2 border-border-default dark:border-surface-subtle hover:border-primary-default dark:hover:border-primary-default transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-subtle flex items-center justify-center mb-6 group-hover:bg-primary-default transition-colors duration-300">
                <Squares2x2 className="w-8 h-8 text-primary-darker group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-text-title">My Predictions</h3>
              <p className="text-text-subtitle mb-4">
                View all your predictions and their status across different pools.
              </p>
              <div className="text-sm text-primary-darker dark:text-primary-default font-medium">
                View Predictions →
              </div>
            </div>
            <Ripple />
          </Link>

          {/* My Created Pools */}
          <Link
            to="/activity/created-pools"
            className="group p-8 rounded-3xl bg-app-bg border-2 border-border-default dark:border-surface-subtle hover:border-primary-default dark:hover:border-primary-default transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-subtle flex items-center justify-center mb-6 group-hover:bg-primary-default transition-colors duration-300">
                <Briefcase className="w-8 h-8 text-primary-darker group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-text-title">My Created Pools</h3>
              <p className="text-text-subtitle mb-4">
                Manage and view all the community pools you have created.
              </p>
              <div className="text-sm text-primary-darker dark:text-primary-default font-medium">
                View Created Pools →
              </div>
            </div>
            <Ripple />
          </Link>
        </div>
      </div>
    </div>
  );
};
