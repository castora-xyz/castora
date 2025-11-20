import ExternalLink from '@/assets/external-link.svg?react';
import Trophy from '@/assets/trophy.svg?react';
import History from '@/assets/history.svg?react';
import { Web3Avatar } from '@/components';
import { useLeaderboard } from '@/contexts';
import { LeaderboardEntry } from '@/schemas';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, ColumnDef } from '@tanstack/react-table';
import { useMemo, useEffect, useState } from 'react';
import { Breathing } from 'react-shimmer';
import { useAccount, useChains } from 'wagmi';
import { Tooltip } from 'primereact/tooltip';
import { formatTime } from '@/contexts/format-time';

const shortenAddress = (v: string) => `${v.substring(0, 6)}...${v.substring(v.length - 3)}`;

const formatUSD = (amount: number): string => {
  if (amount === 0) return '0.00';
  if (amount < 0.01) return '0.01';
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`;
  return `${amount.toFixed(2)}`;
};

const getRankIcon = (rank: number) => {
  if (rank === 1) {
    return <Trophy className="w-5 h-5 fill-yellow-500 dark:fill-yellow-400" />;
  }

  if (rank === 2) {
    return <Trophy className="w-5 h-5 fill-orange-600 dark:fill-orange-500" />;
  }

  if (rank === 3) {
    return <Trophy className="w-5 h-5 fill-gray-400 dark:fill-gray-500" />;
  }
  return null;
};

type LeaderboardRow = LeaderboardEntry & {
  rank: number;
  winRate: string;
  netProfit: number;
};

const columnHelper = createColumnHelper<LeaderboardRow>();

export const LeaderboardPage = () => {
  const { entries, isLoading, hasError, refresh, lastUpdatedTime } = useLeaderboard();
  const { chain: currentChain } = useAccount();
  const [defaultChain] = useChains();
  const [explorerUrl, setExplorerUrl] = useState((currentChain ?? defaultChain).blockExplorers?.default.url);

  useEffect(() => {
    setExplorerUrl((currentChain ?? defaultChain).blockExplorers?.default.url);
  }, [currentChain, defaultChain]);

  useEffect(() => {
    document.title = 'Leaderboard | Castora';
  }, []);

  // Transform entries to include calculated fields
  const data = useMemo(() => {
    return entries.map((entry, index) => {
      const rank = index + 1;
      const winRate = entry.predictions > 0 ? ((entry.winnings / entry.predictions) * 100).toFixed(1) : '0.0';
      const netProfit = entry.winningsVolume - entry.predictionsVolume;
      // xp is already in the entry

      return {
        ...entry,
        rank,
        winRate,
        netProfit
      };
    });
  }, [entries]);

  const columns = useMemo(
    () =>
      [
        columnHelper.accessor('rank', {
          header: 'Rank',
          cell: (info) => {
            const rank = info.getValue();
            return (
              <div className="flex items-center justify-end gap-2">
                {getRankIcon(rank)}
                <span>{rank}</span>
              </div>
            );
          },
          size: 80,
          meta: { align: 'right' },
          enablePinning: true
        }),
        columnHelper.accessor('address', {
          header: 'Address',
          cell: (info) => {
            const address = info.getValue();
            return (
              <a
                href={explorerUrl ? `${explorerUrl}/address/${address}` : undefined}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Web3Avatar address={address} />
                <span className="font-medium opacity-85">{shortenAddress(address)}</span>
                {explorerUrl && <ExternalLink className="w-4 h-4 fill-text-caption" />}
              </a>
            );
          },
          size: 180,
          meta: { align: 'left' }
        }),
        columnHelper.accessor('xp', {
          header: 'XP',
          cell: (info) => {
            const xp = info.getValue();
            return (
              <span className="font-bold text-primary-darker dark:text-primary-default">{xp.toLocaleString()}</span>
            );
          },
          size: 120,
          meta: { align: 'right' }
        }),
        columnHelper.accessor('pools', {
          header: 'Pools Created',
          cell: () => {
            // Hardcoded to 0 for now as requested
            return <span className="font-medium">0</span>;
          },
          size: 120,
          meta: { align: 'right' }
        }),
        columnHelper.accessor('predictions', {
          header: 'Predictions',
          cell: (info) => {
            return <span className="font-medium">{info.getValue()}</span>;
          },
          size: 110,
          meta: { align: 'right' }
        }),
        columnHelper.accessor('predictionsVolume', {
          header: 'Total Staked',
          cell: (info) => {
            return <span className="font-medium opacity-75">{formatUSD(info.getValue())}</span>;
          },
          size: 130,
          meta: { align: 'right' }
        }),
        columnHelper.accessor('winningsVolume', {
          header: 'Total Won',
          cell: (info) => {
            return (
              <span className="font-bold text-success-darker dark:text-success-default">
                {formatUSD(info.getValue())}
              </span>
            );
          },
          size: 120,
          meta: { align: 'right' }
        }),
        columnHelper.accessor('netProfit', {
          header: 'P/L',
          cell: (info) => {
            const profit = info.getValue();
            return (
              <span
                className={`font-medium ${
                  profit >= 0
                    ? 'text-success-darker dark:text-success-default'
                    : 'text-errors-darker dark:text-errors-default'
                }`}
              >
                {formatUSD(profit)}
              </span>
            );
          },
          size: 120,
          meta: { align: 'right' }
        }),
        columnHelper.accessor((row) => ({ winRate: row.winRate, wins: row.winnings, total: row.predictions }), {
          id: 'winRate',
          header: 'Win Rate',
          cell: (info) => {
            const { winRate, wins, total } = info.getValue();
            return (
              <>
                <span className="font-medium">{winRate}%</span>
                <span className="text-xs opacity-60 ml-1">
                  ({wins}/{total})
                </span>
              </>
            );
          },
          size: 140,
          meta: { align: 'right' }
        })
      ] as ColumnDef<LeaderboardRow>[],
    [explorerUrl]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnPinning: true,
    initialState: {
      columnPinning: {
        left: ['rank']
      }
    }
  });

  return (
    <>
      <div className="w-full pl-0 bg-app-bg p-6 text-sm text-text-subtitle">
        <div className="flex flex-wrap gap-4 max-w-screen-xl mx-auto">
          <p className="py-2 px-5 rounded-full w-fit border border-border-default dark:border-surface-subtle">
            <span>Leaderboard</span>
          </p>

          <Tooltip target="#last-update-time" />
          <p
            id="last-update-time"
            className="py-2 px-3.5 rounded-full w-fit border border-border-default dark:border-surface-subtle flex items-center gap-1"
            data-pr-tooltip={`Last Updated At: ${`${new Date(lastUpdatedTime)}`.split('GMT')[0]}`}
          >
            <History className="w-4 h-4 fill-primary-default" />
            <span>{formatTime(new Date(lastUpdatedTime)).reverse().join(' ')}</span>
          </p>
        </div>
      </div>

      <div className="w-full max-w-screen-xl mx-auto">
        {isLoading && (
          <div className="flex justify-center items-center gap-2 max-sm:grow max-sm:text-center py-20 sm:border sm:border-border-default sm:dark:border-surface-subtle sm:rounded-2xl sm:px-16 md:px-4 lg:px-8 sm:text-center">
            <Breathing width={18} height={18} className="rounded-full" />
            <Breathing width={18} height={18} className="rounded-full" />
            <Breathing width={18} height={18} className="rounded-full" />
          </div>
        )}

        {hasError && (
          <div className="max-sm:flex max-sm:flex-col max-sm:justify-center max-sm:items-center max-sm:grow max-sm:text-center max-sm:py-12 sm:border sm:border-border-default sm:dark:border-surface-subtle sm:rounded-2xl sm:py-16 sm:px-16 md:px-4 lg:px-8 sm:gap-4 sm:text-center">
            <p className="text-lg mb-4">Error loading leaderboard</p>
            <button
              onClick={refresh}
              className="py-2 px-6 rounded-full bg-primary-default text-white font-medium hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !hasError && entries.length === 0 && (
          <div className="max-sm:flex max-sm:flex-col max-sm:justify-center max-sm:items-center max-sm:grow max-sm:text-center max-sm:py-12 sm:border sm:border-border-default sm:dark:border-surface-subtle sm:rounded-2xl sm:py-16 sm:px-16 md:px-4 lg:px-8 sm:gap-4 sm:text-center">
            <p className="text-lg mb-8">The leaderboard is being prepared. Please check back later.</p>
          </div>
        )}

        {!isLoading && !hasError && entries.length > 0 && (
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="min-w-full inline-block">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b-2 border-border-default dark:border-surface-subtle">
                      {headerGroup.headers.map((header) => {
                        return (
                          <th
                            key={header.id}
                            className={` ${
                              (header.column.columnDef.meta as { align?: string })?.align === 'right'
                                ? 'text-right'
                                : 'text-left'
                            } py-4 px-4 text-sm font-medium text-text-subtitle`}
                            style={{
                              minWidth: header.getSize(),
                              width: header.getSize()
                            }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => {
                    return (
                      <tr
                        key={row.id}
                        className={`group border-b border-border-default dark:border-surface-subtle hover:bg-surface-subtle dark:hover:bg-surface-disabled transition-colors `}
                      >
                        {row.getVisibleCells().map((cell) => {
                          return (
                            <td
                              key={cell.id}
                              className={` ${
                                (cell.column.columnDef.meta as { align?: string })?.align === 'right'
                                  ? 'text-right'
                                  : 'text-left'
                              } py-4 px-4`}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
