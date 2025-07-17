import Discord from '@/assets/discord.svg?react';
import X from '@/assets/x.svg?react';
import { Ripple } from 'primereact/ripple';
import { Link } from 'react-router-dom';

export const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer
      id="footer"
      className="mt-auto max-[414px]:px-4 px-8 py-10 lg:px-16 border-t border-border-default dark:border-surface-subtle bg-app-bg"
    >
      <div className="flex max-sm:flex-col items-center md:flex-row-reverse sm:justify-between max-w-screen-xl mx-auto gap-8">
        <div className="flex items-center gap-6">
          <a
            href="https://discord.gg/wmHceHvNBD"
            target="_blank"
            rel="noopener noreferrer"
            title="Join our Discord"
            className="border border-border-default dark:border-surface-subtle rounded-full px-6 py-1 p-ripple"
          >
            <Discord className="w-10 h-10 fill-text-body" />
            <Ripple />
          </a>
          <a
            href="https://x.com/castora_xyz"
            target="_blank"
            rel="noopener noreferrer"
            title="Follow us on X (Twitter)"
            className="border border-border-default dark:border-surface-subtle rounded-full px-6 py-1 p-ripple"
          >
            <X className="w-10 h-10 fill-text-body" />
            <Ripple />
          </a>
        </div>

        <p className="text-xl max-sm:text-center max-md:text-right">
          All Rights Reserved &copy; {year} <Link to="/">Castora</Link>
        </p>
      </div>
    </footer>
  );
};
