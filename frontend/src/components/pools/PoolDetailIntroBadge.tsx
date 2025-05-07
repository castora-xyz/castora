import ArrowLeftCircle from '@/assets/arrow-left-circle.svg?react';
import ChevronRight from '@/assets/chevron-right.svg?react';
import Timer from '@/assets/timer.svg?react';
import { Pool } from '@/schemas';
import { Ripple } from 'primereact/ripple';
import { useLocation, useNavigate } from 'react-router-dom';

export const PoolDetailIntroBadge = ({ pool: { seeds } }: { pool: Pool }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className={
        'w-full max-w-screen-xl mx-auto mb-4 text-text-subtitle flex gap-4' +
        (seeds.status() === 'Completed' ? ' max-lg:max-w-lg' : '')
      }
    >
      <button
        className="hover:underline p-ripple flex gap-2 lg:hidden"
        role="link"
        onClick={() => navigate(location.state?.from || '/')}
      >
        <ArrowLeftCircle className="stroke-text-subtitle" />
        <span>Back To Pools</span>
        <Ripple />
      </button>

      <p className="text-sm py-2 px-5 flex gap-2 rounded-full w-fit border border-border-default dark:border-surface-subtle text-text-subtitle max-lg:hidden">
        <button
          className="hover:underline p-ripple"
          role="link"
          onClick={() => navigate(location.state?.from || '/pools')}
        >
          <span>Pools</span>
          <Ripple />
        </button>
        <ChevronRight className="fill-text-subtitle" />
        <span>{seeds.pairName()}</span>
      </p>

      <p className="text-sm px-3.5 rounded-full w-fit border border-border-default dark:border-surface-subtle text-text-subtitle max-lg:hidden flex items-center gap-1">
        <Timer className="fill-text-caption w-4 h-4" />
        <span className="mr-1">{seeds.displayPoolLife()}</span>
      </p>
    </div>
  );
};
