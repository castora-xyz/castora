import ChevronDown from '@/assets/chevron-down.svg?react';
import { useFirebase } from '@/contexts';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Ripple } from 'primereact/ripple';
import { ReactElement, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PageIntroType } from '..';

export const cryptoPoolsType = { title: 'Crypto', route: '/pools/crypto' };
export const stockPoolsType = { title: 'Stocks', route: '/pools/stocks' };
export const communityPoolsType = { title: 'Community', route: '/pools/community' };

export const poolsPagesTypes: PageIntroType[] = [cryptoPoolsType, stockPoolsType, communityPoolsType];

export const PoolsPageIntro = ({
  filter,
  poolsPageType: { title }
}: {
  filter?: ReactElement;
  poolsPageType: PageIntroType;
}) => {
  const { recordEvent } = useFirebase();
  const overlayRef = useRef<OverlayPanel>(null);

  return (
    <div className="w-full pl-0 top-16 sm:top-[72px] sticky z-10 bg-app-bg p-6 text-sm flex flex-wrap gap-4 text-text-subtitle">
      <p className="text-sm py-2 px-5 rounded-full w-fit border border-border-default dark:border-surface-subtle text-text-subtitle">
        Pools
      </p>

      <button
        className="text-sm py-2 px-5 rounded-full w-fit border border-border-default dark:border-surface-subtle text-text-subtitle p-ripple flex items-center"
        onClick={(e) => {
          overlayRef.current?.toggle(e);
          recordEvent('clicked_current_pools_page_category', { category: title });
        }}
      >
        <span>{title}</span>
        <ChevronDown className="ml-1 w-4 h-4 sm:w-5 sm:h-5 fill-text-body" />
        <Ripple />
      </button>

      <OverlayPanel
        ref={overlayRef}
        pt={{ root: { className: 'p-0 rounded-lg bg-app-bg' }, content: { className: 'p-0' } }}
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

      {filter}
    </div>
  );
};
