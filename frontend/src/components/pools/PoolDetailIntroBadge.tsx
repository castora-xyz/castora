import ArrowLeftCircle from '@/assets/arrow-left-circle.svg?react';
import ChevronRight from '@/assets/chevron-right.svg?react';
import { Pool } from '@/schemas';
import { Ripple } from 'primereact/ripple';
import { useLocation, useNavigate } from 'react-router-dom';

export const PoolDetailIntroBadge = ({ pool: { seeds } }: { pool: Pool }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className={
        'w-full max-w-screen-xl mx-auto text-text-subtitle' +
        (seeds.status() === 'Completed' ? ' max-lg:max-w-lg' : '')
      }
    >
      <button
        className="hover:underline p-ripple flex gap-2 mb-4 lg:hidden"
        role="link"
        onClick={() => navigate(location.state?.from || '/')}
      >
        <ArrowLeftCircle className="stroke-text-subtitle" />
        <span>Back To Pools</span>
        <Ripple />
      </button>

      <p className="text-sm py-2 px-5 mb-4 flex gap-2 rounded-full w-fit border border-border-default dark:border-surface-subtle text-text-subtitle max-lg:hidden">
        <button
          className="hover:underline p-ripple"
          role="link"
          onClick={() => navigate(location.state?.from || '/')}
        >
          <span>Pools</span>
          <Ripple />
        </button>
        <ChevronRight className="fill-text-subtitle" />
        <span>{seeds.pairName()}</span>
      </p>
    </div>
  );
};
