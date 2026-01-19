import { useFirebase } from '@/contexts';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ReactNode, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PageIntroType } from '..';
export const predictionsActivityType = { title: 'My Predictions', route: '/activity/predictions' };
export const createdPoolsActivityType = { title: 'My Created Pools', route: '/activity/created-pools' };
export const myActivityTypes: PageIntroType[] = [predictionsActivityType, createdPoolsActivityType];

export const MyActivityPagesMenu = ({ children, placement, chain }: { children: ReactNode; placement: string, chain: string }) => {
  const { recordEvent } = useFirebase();
  const overlayRef = useRef<OverlayPanel>(null);
  return (
    <div
      onClick={(e) => {
        overlayRef.current?.toggle(e);
        recordEvent('clicked_my_activity_menu', { category: placement });
      }}
      key={placement + '_my_activity_menu'}
    >
      {children}
      <OverlayPanel
        ref={overlayRef}
        pt={{ root: { className: 'p-0 rounded-lg bg-app-bg' }, content: { className: 'p-0' } }}
        dismissable
      >
        {myActivityTypes.map(({ title, route }) => (
          <Link
            key={title}
            to={`${chain}/${route}`}
            className="block px-5 py-3 hover:bg-surface-default"
            onClick={() => recordEvent('selected_my_activity_category', { category: title })}
          >
            {title}
          </Link>
        ))}
      </OverlayPanel>
    </div>
  );
};
