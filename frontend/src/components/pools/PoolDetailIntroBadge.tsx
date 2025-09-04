import Bolt from '@/assets/bolt.svg?react';
import Briefcase from '@/assets/briefcase.svg?react';
import ChevronRight from '@/assets/chevron-right.svg?react';
import InfoCircle from '@/assets/info-circle.svg?react';
import Timer from '@/assets/timer.svg?react';
import Trophy from '@/assets/trophy.svg?react';
import { Pool } from '@/schemas';
import { Ripple } from 'primereact/ripple';
import { Tooltip } from 'primereact/tooltip';
import { Link, useLocation } from 'react-router-dom';

export const PoolDetailIntroBadge = ({ pool, pool: { seeds } }: { pool: Pool }) => {
  const location = useLocation();

  return (
    <div
      className={
        'w-full max-w-screen-xl mx-auto mb-4 text-text-subtitle flex flex-wrap gap-4' +
        (seeds.status() === 'Completed' ? ' max-lg:max-w-lg' : '')
      }
    >
      <div className="text-sm py-2 px-5 flex gap-2 rounded-full w-fit border border-border-default dark:border-surface-subtle">
        <Tooltip target="#backwards" />
        <p id="backwards" data-pr-tooltip="Go Back" className="flex gap-2">
          <Link
            className="hover:underline p-ripple text-primary-default"
            to={location.state?.from?.pathname ?? '/pools'}
          >
            <span>Pools</span>
            <Ripple />
          </Link>
          <ChevronRight className="fill-primary-default" />
        </p>
        <p className="flex gap-1.5 items-center">
          {seeds.predictionTokenDetails.img && (
            <img src={`/assets/${seeds.predictionTokenDetails.img}.png`} className="w-5 h-5 rounded-full" />
          )}
          <span>{seeds.pairName()}</span>
        </p>
      </div>

      <div className="w-fit flex gap-4">
        <Tooltip target="#pool-life" />
        <p
          id="pool-life"
          className="text-sm py-2 px-3.5 rounded-full w-fit border border-border-default dark:border-surface-subtle flex items-center gap-1"
          data-pr-tooltip={pool.isFlash() ? 'Flash Pool' : 'Pool Life'}
        >
          <Timer className="fill-primary-default w-4 h-4" />
          {pool.isFlash() ? (
            <Bolt className="w-4 h-4 ml-1 text-text-caption" />
          ) : (
            <span className="mr-1">{seeds.displayPoolLife()}</span>
          )}
        </p>

        <Tooltip target="#pool-multiplier" />
        <p
          id="pool-multiplier"
          className="text-sm py-2 px-3.5 rounded-full w-fit border border-border-default dark:border-surface-subtle flex items-center gap-1"
          data-pr-tooltip="Pool Multiplier"
        >
          <Trophy className="stroke-primary-default w-4 h-4" />
          <span className="mr-1">x{pool.multiplier()}</span>
        </p>
      </div>

      <div className="w-fit flex gap-4">
        {seeds.isStockPool() && (
          <>
            <Tooltip target="#pool-category" />
            <p
              id="pool-category"
              className="text-sm py-2 px-3.5 rounded-full w-fit border border-border-default dark:border-surface-subtle flex items-center gap-1"
              data-pr-tooltip="Pool Category"
            >
              <Briefcase className="stroke-primary-default w-4 h-4" />
              <span className="mr-1">Stock</span>
            </p>
          </>
        )}

        {seeds.status() === 'Upcoming' && (
          <>
            <Tooltip target="#pool-status" />
            <p
              id="pool-status"
              className="text-sm py-2 px-3.5 rounded-full w-fit border border-border-default dark:border-surface-subtle flex items-center gap-1"
              data-pr-tooltip="Pool Status"
            >
              <InfoCircle className="stroke-primary-default w-4 h-4" />
              <span className="mr-1">{seeds.status()}</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
