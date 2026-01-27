import { useTheme } from '@/contexts';
import { getChainName } from '@/utils/config';
import { Pool } from '@/schemas';
import { useEffect, useRef } from 'react';
import { useConnection } from 'wagmi';

export const LandingEmbeddedPage = ({ pool }: { pool: Pool | null }) => {
  const { isDarkDisplay } = useTheme();
  console.log('isDarkDisplay', isDarkDisplay);
  const { chain: currentChain } = useConnection();
  const chainName = getChainName(currentChain);
  const observerRef = useRef<MutationObserver | null>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  const makeAdjustments = () => {
    const iframe = document.querySelector('iframe#iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentDocument) {
      const iframeDoc = iframe.contentDocument;
      const iframeHtml = iframeDoc.documentElement;
      
      // Clean up previous observer if it exists
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      
      // Clear any pending timeouts
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
      
      iframeDoc.body?.classList.add('pointer-events-none');
      const bottomNav = iframeDoc.querySelector(
        '#bottom-nav'
      ) as HTMLDivElement;
      if (bottomNav) bottomNav.style.display = 'none';
      const footer = iframeDoc.querySelector(
        'footer#footer'
      ) as HTMLDivElement;
      if (footer) footer.style.display = 'none';
      
      const themeLink = iframe.querySelector('#theme-link') as HTMLLinkElement;
      
      // Function to apply theme class with safety checks
      const applyTheme = () => {
        const currentIframe = document.querySelector('iframe#iframe') as HTMLIFrameElement;
        if (!currentIframe?.contentDocument) return;
        const html = currentIframe.contentDocument.documentElement;
        if (isDarkDisplay) {
          html.classList.add('dark');
          if (themeLink) themeLink.href = themeLink.href.replace('light', 'dark');
        } else {
          html.classList.remove('dark');
          if (themeLink) themeLink.href = themeLink.href.replace('dark', 'light');
        }
      };
      
      // Apply immediately
      applyTheme();
      
      // Use MutationObserver to watch for class changes and re-apply
      observerRef.current = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const hasDark = iframeHtml.classList.contains('dark');
            if (isDarkDisplay && !hasDark) {
              // Class was removed, re-add it
              iframeHtml.classList.add('dark');
            } else if (!isDarkDisplay && hasDark) {
              // Class should be removed
              iframeHtml.classList.remove('dark');
            }
          }
        });
      });
      
      observerRef.current.observe(iframeHtml, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      // Apply theme after delays to catch React initialization
      // Store timeout IDs for cleanup
      const delays = [100, 500, 1000];
      delays.forEach(delay => {
        const timeoutId = setTimeout(() => {
          applyTheme();
        }, delay);
        timeoutRefs.current.push(timeoutId);
      });
    }
  };

  useEffect(() => {
    makeAdjustments();
    
    // Cleanup observer and timeouts on unmount or when dependencies change
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, [pool, isDarkDisplay]);

  return (
    <div className="bg-black dark:bg-white p-2 rounded-t-2xl -mb-2 xs:-mb-8">
      <div className="bg-app-bg rounded-t-xl -mb-2 max-lg:h-[600px] lg:h-[448px]">
        <iframe
          src={pool ? `/${chainName}/pool/${pool.poolId}` : `/${chainName}/pools`}
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
