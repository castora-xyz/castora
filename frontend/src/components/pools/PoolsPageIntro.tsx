import ChevronDown from '@/assets/chevron-down.svg?react';
import { Ripple } from 'primereact/ripple';
import { ReactElement } from 'react';
import { PageIntroType, PoolsPagesMenu } from '..';

export const PoolsPageIntro = ({
  filter,
  poolsPageType: { title }
}: {
  filter?: ReactElement;
  poolsPageType: PageIntroType;
}) => {
  return (
    <div className="w-full pl-0 top-16 sm:top-[72px] sticky z-10 bg-app-bg p-6 text-sm flex flex-wrap gap-4 text-text-subtitle">
      <p className="text-sm py-2 px-5 rounded-full w-fit border border-border-default dark:border-surface-subtle text-text-subtitle max-sm:hidden">
        Pools
      </p>

      <PoolsPagesMenu placement="pools_page_intro">
        <button className="text-sm py-2 px-5 rounded-full w-fit border border-border-default dark:border-surface-subtle text-text-subtitle p-ripple flex items-center">
          <span>{title}</span>
          <ChevronDown className="ml-1 w-4 h-4 sm:w-5 sm:h-5 fill-text-body" />
          <Ripple />
        </button>
      </PoolsPagesMenu>

      {filter}
    </div>
  );
};
