import { useTheme } from '@/contexts';
import { Pool } from '@/schemas';
import { useEffect } from 'react';

export const LandingEmbeddedPage = ({ pool }: { pool: Pool | null }) => {
  const { isDarkDisplay } = useTheme();

  const makeAdjustments = () => {
    const iframe = document.querySelector('iframe#iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.contentDocument?.body?.classList.add('pointer-events-none');
      const bottomNav = iframe.contentDocument!.querySelector(
        '#bottom-nav'
      ) as HTMLDivElement;
      if (bottomNav) bottomNav.style.display = 'none';
      const footer = iframe.contentDocument!.querySelector(
        'footer#footer'
      ) as HTMLDivElement;
      if (footer) footer.style.display = 'none';
      const themeLink = iframe.querySelector('#theme-link') as HTMLLinkElement;
      if (isDarkDisplay) {
        iframe.contentDocument?.body?.classList.add('dark');
        if (themeLink) themeLink.href = themeLink.href.replace('light', 'dark');
      } else {
        iframe.contentDocument?.body?.classList.remove('dark');
        if (themeLink) themeLink.href = themeLink.href.replace('dark', 'light');
      }
    }
  };

  useEffect(() => {
    makeAdjustments();
  }, [pool, isDarkDisplay]);

  return (
    <div className="bg-black dark:bg-white p-2 rounded-t-2xl -mb-2 xs:-mb-8">
      <div className="bg-app-bg rounded-t-xl -mb-2 max-lg:h-[600px] lg:h-[448px]">
        <iframe
          src={pool ? `/pool/${pool.poolId}` : '/pools'}
          width="100%"
          height="100%"
          className="rounded-t-xl"
          id="iframe"
          onLoad={makeAdjustments}
        ></iframe>
      </div>
    </div>
  );
};
