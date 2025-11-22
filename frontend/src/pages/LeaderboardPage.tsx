import ExternalLink from '@/assets/external-link.svg?react';
import History from '@/assets/history.svg?react';
import Trophy from '@/assets/trophy.svg?react';
import { Web3Avatar } from '@/components';
import { useAuth, useLeaderboard } from '@/contexts';
import { formatTime } from '@/contexts/format-time';
import { LeaderboardEntry } from '@/schemas';
import { ColumnDef, createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Tooltip } from 'primereact/tooltip';
import { useEffect, useMemo, useState } from 'react';
import { Breathing } from 'react-shimmer';
import { useAccount, useChains } from 'wagmi';

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
  isGap?: boolean;
  isPlaceholder?: boolean;
};

const columnHelper = createColumnHelper<LeaderboardRow>();

export const LeaderboardPage = () => {
  const { entries, isLoading, hasError, refresh, lastUpdatedTime, mine, totalUsersCount } = useLeaderboard();
  const { address } = useAuth();
  const { chain: currentChain } = useAccount();
  const [defaultChain] = useChains();
  const [explorerUrl, setExplorerUrl] = useState((currentChain ?? defaultChain).blockExplorers?.default.url);

  const addFillerToRows = (rows: LeaderboardRow[], rank: number, isGap: boolean, isPlaceholder: boolean) => {
    rows.push({
      ...{ address: '', xp: 0, winningsVolume: 0, pools: 0, predictionsVolume: 0 },
      ...{ winnings: 0, predictions: 0, rank, winRate: '', netProfit: 0, isGap, isPlaceholder }
    });
  };

  useEffect(() => {
    setExplorerUrl((currentChain ?? defaultChain).blockExplorers?.default.url);
  }, [currentChain, defaultChain]);

  useEffect(() => {
    document.title = 'Leaderboard | Castora';
  }, []);

  // Transform entries to include calculated fields
  const data = useMemo(() => {
    const rows: LeaderboardRow[] = entries.map((entry, index) => {
      const rank = index + 1;
      const winRate = entry.predictions > 0 ? ((entry.winnings / entry.predictions) * 100).toFixed(1) : '0.0';
      const netProfit = entry.winningsVolume - entry.predictionsVolume;

      return {
        ...entry,
        rank,
        winRate,
        netProfit
      };
    });

    if (mine && address) {
      const isMineInTop = rows.some((r) => r.address.toLowerCase() === address.toLowerCase());

      if (!isMineInTop) {
        // Add gap
        addFillerToRows(rows, 0, true, false);

        // Add mine
        const winRate = mine.predictions > 0 ? ((mine.winnings / mine.predictions) * 100).toFixed(1) : '0.0';
        const netProfit = mine.winningsVolume - mine.predictionsVolume;
        rows.push({ ...mine, winRate, netProfit });
      }

      // Add placeholder if mine is not last
      if (mine.rank < totalUsersCount) {
        // first add gap still
        addFillerToRows(rows, 0, true, false);
        addFillerToRows(rows, totalUsersCount, false, true);
      }
    }

    return rows;
  }, [entries, mine, address, totalUsersCount]);

  const columns = useMemo(
    () =>
      [
        columnHelper.accessor('rank', {
          header: 'Rank',
          cell: (info) => {
            const { isGap, rank } = info.row.original;
            if (isGap) {
              return (
                <div className="flex flex-col items-end justify-center gap-1 h-full">
                  <div className="w-1 h-1 bg-text-caption rounded-full"></div>
                  <div className="w-1 h-1 bg-text-caption rounded-full"></div>
                  <div className="w-1 h-1 bg-text-caption rounded-full"></div>
                </div>
              );
            }
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
            const { isGap, isPlaceholder, address: rowAddress } = info.row.original;
            if (isGap || isPlaceholder) return <span className="opacity-50">--</span>;
            const isMe = address && rowAddress.toLowerCase() === address.toLowerCase();
            return (
              <a
                href={explorerUrl ? `${explorerUrl}/address/${rowAddress}` : undefined}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Web3Avatar address={rowAddress} />
                <span className="font-medium opacity-85">
                  {shortenAddress(rowAddress)}
                  {isMe && <span className="ml-1 font-bold text-primary-darker dark:text-primary-default">(Me)</span>}
                </span>
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
            const { isGap, isPlaceholder, xp } = info.row.original;
            if (isGap || isPlaceholder) return <span className="opacity-50">--</span>;
            return (
              <span className="font-bold text-primary-darker dark:text-primary-default">{xp.toLocaleString()}</span>
            );
          },
          size: 120,
          meta: { align: 'right' }
        }),
        columnHelper.accessor('createdPools', {
          header: 'Pools Created',
          cell: (info) => {
            const { isGap, isPlaceholder, createdPools } = info.row.original;
            if (isGap || isPlaceholder) return <span className="opacity-50">--</span>;
            return <span className="font-medium">{createdPools ?? 0}</span>;
          },
          size: 120,
          meta: { align: 'right' }
        }),
        columnHelper.accessor('predictions', {
          header: 'Predictions',
          cell: (info) => {
            const { isGap, isPlaceholder } = info.row.original;
            if (isGap || isPlaceholder) return <span className="opacity-50">--</span>;
            return <span className="font-medium">{info.getValue()}</span>;
          },
          size: 110,
          meta: { align: 'right' }
        }),
        columnHelper.accessor('predictionsVolume', {
          header: 'Total Staked',
          cell: (info) => {
            const { isGap, isPlaceholder } = info.row.original;
            if (isGap || isPlaceholder) return <span className="opacity-50">--</span>;
            return <span className="font-medium opacity-75">{formatUSD(info.getValue())}</span>;
          },
          size: 130,
          meta: { align: 'right' }
        }),
        columnHelper.accessor('winningsVolume', {
          header: 'Total Won',
          cell: (info) => {
            const { isGap, isPlaceholder } = info.row.original;
            if (isGap || isPlaceholder) return <span className="opacity-50">--</span>;
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
            const { isGap, isPlaceholder } = info.row.original;
            if (isGap || isPlaceholder) return <span className="opacity-50">--</span>;
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
            const { isGap, isPlaceholder } = info.row.original;
            if (isGap || isPlaceholder) return <span className="opacity-50">--</span>;
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
    [explorerUrl, address]
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
      <div className="w-full bg-app-bg pt-6 text-sm text-text-subtitle">
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
          <div className="mt-6 flex justify-center items-center gap-2 max-sm:grow max-sm:text-center py-20 sm:border sm:border-border-default sm:dark:border-surface-subtle sm:rounded-2xl sm:px-16 md:px-4 lg:px-8 sm:text-center">
            <Breathing width={18} height={18} className="rounded-full" />
            <Breathing width={18} height={18} className="rounded-full" />
            <Breathing width={18} height={18} className="rounded-full" />
          </div>
        )}

        {hasError && (
          <div className="mt-6 max-sm:flex max-sm:flex-col max-sm:justify-center max-sm:items-center max-sm:grow max-sm:text-center max-sm:py-12 sm:border sm:border-border-default sm:dark:border-surface-subtle sm:rounded-2xl sm:py-16 sm:px-16 md:px-4 lg:px-8 sm:gap-4 sm:text-center">
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
          <div className="overflow-auto max-h-[80vh]">
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
                            } py-4 px-4 text-sm font-medium text-text-subtitle sticky top-0 bg-app-bg ${
                              header.column.getIsPinned() ? 'left-0 z-20' : 'z-10'
                            }`}
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
                              } py-4 px-4 ${
                                cell.column.getIsPinned()
                                  ? 'bg-app-bg sticky left-0 z-10 group-hover:bg-surface-subtle dark:group-hover:bg-surface-disabled'
                                  : ''
                              }`}
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
