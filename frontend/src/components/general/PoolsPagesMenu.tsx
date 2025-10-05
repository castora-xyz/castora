import { useFirebase } from '@/contexts';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ReactNode, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PageIntroType } from '..';

export const cryptoPoolsType = { title: 'Crypto', route: '/pools/crypto' };
export const stockPoolsType = { title: 'Stocks', route: '/pools/stocks' };
export const communityPoolsType = { title: 'Community', route: '/pools/community' };

export const poolsPagesTypes: PageIntroType[] = [cryptoPoolsType, stockPoolsType, communityPoolsType];

export const PoolsPagesMenu = ({ children, placement }: { children: ReactNode; placement: string }) => {
  const { recordEvent } = useFirebase();
  const overlayRef = useRef<OverlayPanel>(null);

  return (
    <div
      onClick={(e) => {
        overlayRef.current?.toggle(e);
        recordEvent('clicked_pools_page_menu', { placement });
      }}
      key={placement + '_pools_menu'}
    >
      {children}

      <OverlayPanel
        ref={overlayRef}
        pt={{ root: { className: 'p-0 rounded-lg bg-app-bg' }, content: { className: 'p-0' } }}
        dismissable
      >
        {poolsPagesTypes.map(({ title, route }) => (
          <Link
            key={title}
            to={route}
            className="block px-5 py-3 hover:bg-surface-default"
            onClick={() => recordEvent('selected_pools_page_category', { category: title })}
          >
            {title}
          </Link>
        ))}
      </OverlayPanel>
    </div>
  );
};
