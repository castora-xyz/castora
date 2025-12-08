import Discord from '@/assets/discord.svg?react';
import X from '@/assets/x.svg?react';
import { Ripple } from 'primereact/ripple';
import { Link, NavLink } from 'react-router-dom';
import Castora from '/assets/castora.png';

export const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer
      id="footer"
      className="mt-auto max-[414px]:px-4 px-8 py-12 lg:px-16 border-t border-border-default dark:border-surface-subtle bg-app-bg"
    >
      <div className="max-w-screen-xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img src={Castora} alt="Castora" className="w-8 md:w-10" />
            </Link>
            <p className="text-text-subtitle text-sm">
              Predict, stake, and win. The decentralized prediction platform for crypto and stocks.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://discord.gg/wmHceHvNBD"
                target="_blank"
                rel="noopener noreferrer"
                title="Join our Discord"
                className="border border-border-default dark:border-surface-subtle rounded-full p-2 p-ripple hover:bg-surface-hover transition-colors"
              >
                <Discord className="w-5 h-5 fill-text-body" />
                <Ripple />
              </a>
              <a
                href="https://x.com/castora_xyz"
                target="_blank"
                rel="noopener noreferrer"
                title="Follow us on X (Twitter)"
                className="border border-border-default dark:border-surface-subtle rounded-full p-2 p-ripple hover:bg-surface-hover transition-colors"
              >
                <X className="w-5 h-5 fill-text-body" />
                <Ripple />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="text-text-titles font-semibold text-base">Navigation</h3>
            <nav className="flex flex-col gap-3">
              <NavLink
                to="/pools"
                className="text-text-subtitle hover:text-primary-darker dark:hover:text-primary-default transition-colors text-sm p-ripple"
              >
                <Ripple />
                Pools
              </NavLink>
              <NavLink
                to="/leaderboard"
                className="text-text-subtitle hover:text-primary-darker dark:hover:text-primary-default transition-colors text-sm p-ripple"
              >
                <Ripple />
                Leaderboard
              </NavLink>
              <NavLink
                to="/activity/predictions"
                className="text-text-subtitle hover:text-primary-darker dark:hover:text-primary-default transition-colors text-sm p-ripple"
              >
                <Ripple />
                My Activity
              </NavLink>
              <NavLink
                to="/pools/create"
                className="text-text-subtitle hover:text-primary-darker dark:hover:text-primary-default transition-colors text-sm p-ripple"
              >
                <Ripple />
                Create Pool
              </NavLink>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="text-text-titles font-semibold text-base">Legal</h3>
            <nav className="flex flex-col gap-3">
              <NavLink
                to="/terms"
                className="text-text-subtitle hover:text-primary-darker dark:hover:text-primary-default transition-colors text-sm p-ripple"
              >
                <Ripple />
                Terms of Service
              </NavLink>
              <NavLink
                to="/privacy"
                className="text-text-subtitle hover:text-primary-darker dark:hover:text-primary-default transition-colors text-sm p-ripple"
              >
                <Ripple />
                Privacy Policy
              </NavLink>
            </nav>
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
            <h3 className="text-text-titles font-semibold text-base">About</h3>
            <nav className="flex flex-col gap-3">
              <a
                href="https://docs.castora.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-subtitle hover:text-primary-darker dark:hover:text-primary-default transition-colors text-sm p-ripple"
              >
                <Ripple />
                Documentation
              </a>
              <a
                href="https://github.com/castora"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-subtitle hover:text-primary-darker dark:hover:text-primary-default transition-colors text-sm p-ripple"
              >
                <Ripple />
                GitHub
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border-default dark:border-surface-subtle">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-text-subtitle text-sm text-center sm:text-left">
              &copy; {year} <Link to="/" className="hover:text-primary-darker dark:hover:text-primary-default transition-colors">Castora</Link>. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-text-subtitle">
              <span>Built on Monad</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
