import { useFirebase } from '@/contexts';
import ChevronDown from '@/assets/chevron-down.svg?react';
import { Menu } from 'primereact/menu';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Ripple } from 'primereact/ripple';
import { ReactElement, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export const predictionsActivityType = { title: 'My Predictions', route: '/activity/predictions' };
export const createdPoolsActivityType = { title: 'My Created Pools', route: '/activity/created-pools' };

export interface MyActivityType {
  title: string;
  route: string;
}

export const myActivityTypes: MyActivityType[] = [predictionsActivityType, createdPoolsActivityType];

export const MyActivityPageIntro = ({
  claimAll,
  myActivityType: { title }
}: {
  claimAll?: ReactElement;
  myActivityType: MyActivityType;
}) => {
  const { recordEvent } = useFirebase();
  const navigate = useNavigate();
  const overlayRef = useRef<OverlayPanel>(null);

  const menuItems = myActivityTypes.map(({ title, route }) => ({
    label: title,
    command: () => {
      recordEvent('selected_my_activity_category', { category: title });
      navigate(route);
      overlayRef.current?.hide();
    }
  }));

  return (
    <div className="flex gap-4 justify-between flex-wrap items-center mb-4">
      <div className="flex gap-4 flex-wrap">
        <p className="text-sm py-2 px-5 rounded-full w-fit border border-border-default dark:border-surface-subtle text-text-subtitle">
          My Activity
        </p>

        <button
          className="text-sm py-2 px-5 rounded-full w-fit border border-border-default dark:border-surface-subtle text-text-subtitle p-ripple flex items-center"
          onClick={(e) => {
            overlayRef.current?.toggle(e);
            recordEvent('clicked_current_my_activity_category', { category: title });
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
          <Menu model={menuItems} pt={{ root: { className: 'bg-app-bg' } }} />
        </OverlayPanel>
      </div>

      {claimAll}
    </div>
  );
};
