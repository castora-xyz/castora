import ExternalLink from '@/assets/external-link.svg?react';
import { Web3Avatar } from '@/components';
import { LeaderboardEntry, TokenAndAmount } from '@/schemas';
import { useEffect, useState } from 'react';
import { Breathing } from 'react-shimmer';
import { useAccount, useChains } from 'wagmi';

const shortenAddress = (v: string) =>
  `${v.substring(0, 6)}...${v.substring(v.length - 3)}`;

const EntryDetails = ({ entry }: { entry: LeaderboardEntry }) => {
  const { stakedAmounts: staked, wonAmounts: won, predictionsCount } = entry;

  const displayTAA = ({ token, amount }: TokenAndAmount) =>
    `${Math.trunc(amount * 100) / 100} ${token}`;

  return (
    <>
      <div className="flex flex-col items-center">
        <p className="text-[10px] opacity-50">Total Staked</p>
        <p className="font-bold text-xl">
          {staked.length > 0 ? displayTAA(staked[0]) : 'N/A'}
        </p>
      </div>

      <div className="flex flex-col items-center">
        <p className="text-[10px] opacity-50">Total Won</p>
        <p className="font-bold text-xl">
          {won.length > 0 ? displayTAA(won[0]) : 'N/A'}
        </p>
      </div>

      <div className="flex flex-col items-center">
        <p className="text-[10px] opacity-50">No Of Predictions</p>
        <p className="font-bold text-xl">
          {predictionsCount > 0 ? predictionsCount : 'N/A'}
        </p>
      </div>
    </>
  );
};

const TopEntry = ({
  entry,
  explorerUrl,
  level
}: {
  entry: LeaderboardEntry;
  explorerUrl?: string | undefined;
  level: number;
}) => {
  const { address } = entry;

  return (
    <div className="rounded-xl border dark:border-surface-subtle  p-4 flex flex-col items-center justify-between flex-wrap gap-4 mb-8 max-w-xs mx-auto md:max-w-sm">
      <a
        href={explorerUrl ? `${explorerUrl}/address/${address}` : undefined}
        className="flex flex-col items-center gap-2 mt-8"
        rel="noopener noreferrer"
        target="_blank"
      >
        <div className="relative">
          <Web3Avatar className="w-16 h-16" address={address} />
          <div className="absolute rounded-full bg-white dark:bg-black opacity-75 top-0 left-0 right-0 bottom-0"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-3xl font-bold">
            {level}
          </div>
        </div>
        <p className="flex items-center gap-2">
          <span className="opacity-85 text-lg">{shortenAddress(address)}</span>
          {explorerUrl && (
            <ExternalLink className="w-5 h-5 -ml-1 mt-0.5 fill-text-caption" />
          )}
        </p>
      </a>
      <div className="mx-auto flex flex-wrap justify-center gap-4 md:gap-12 pb-8">
        <EntryDetails entry={entry} />
      </div>
    </div>
  );
};

export const LeaderboardPage = () => {
  const [isLoading, _] = useState(false);
  const [entries, __] = useState<LeaderboardEntry[]>([]);
  // const { firestore } = useFirebase();
  const { chain: currentChain } = useAccount();
  const [defaultChain] = useChains();
  const [explorerUrl, setExplorerUrl] = useState(
    (currentChain ?? defaultChain).blockExplorers?.default.url
  );

  useEffect(() => {
    setExplorerUrl((currentChain ?? defaultChain).blockExplorers?.default.url);
  }, [currentChain, defaultChain]);

  // useEffect(() => {
  //   return onSnapshot(doc(firestore, '/leaderboard/leaderboard'), (doc) => {
  //     if (doc.exists()) setEntries(doc.data().entries);
  //     else setEntries([]);
  //     setIsLoading(false);
  //   });
  // }, [firestore]);

  useEffect(() => {
    document.title = 'Leaderboard | Castora';
  }, []);

  return (
    <div className="w-full max-md:max-w-lg max-w-screen-md mx-auto">
      <div className="text-sm pt-6 mb-4 flex w-fit gap-4 text-text-subtitle">
        <p className="py-2 px-5 rounded-full w-fit border border-border-default dark:border-surface-subtle">
          <span>Leaderboard</span>
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center gap-2 max-sm:grow max-sm:text-center py-20 sm:border sm:border-border-default sm:dark:border-surface-subtle sm:rounded-2xl sm:px-16 md:px-4 lg:px-8 sm:text-center md:max-w-[600px]">
          <Breathing width={18} height={18} className="rounded-full" />
          <Breathing width={18} height={18} className="rounded-full" />
          <Breathing width={18} height={18} className="rounded-full" />
        </div>
      )}

      {!isLoading &&
        (entries.length === 0 ||
          (currentChain ?? defaultChain).name != 'Monad Testnet') && (
          <div className="max-sm:flex max-sm:flex-col max-sm:justify-center max-sm:items-center max-sm:grow max-sm:text-center max-sm:py-12 sm:border sm:border-border-default sm:dark:border-surface-subtle sm:rounded-2xl sm:py-16 sm:px-16 md:px-4 lg:px-8 sm:gap-4 sm:text-center md:max-w-[600px]">
            <p className="text-lg mb-8">
              The leaderboard is being prepared. Please check back later.
            </p>
          </div>
        )}

      {!isLoading &&
        entries.length > 0 &&
        (currentChain ?? defaultChain).name == 'Monad Testnet' && (
          <>
            <div className="max-md:mb-16 mb-4">
              <TopEntry
                entry={entries[0]}
                level={1}
                explorerUrl={explorerUrl}
              />
              <div className="md:flex md:items-start md:justify-center">
                <TopEntry
                  entry={entries[1]}
                  level={2}
                  explorerUrl={explorerUrl}
                />
                <div className="md:pt-24">
                  <TopEntry
                    entry={entries[2]}
                    level={3}
                    explorerUrl={explorerUrl}
                  />
                </div>
              </div>
            </div>

            {entries.slice(3).map((entry, index) => {
              const { address } = entry;

              return (
                <div
                  key={index}
                  className="rounded-xl border dark:border-surface-subtle p-4 flex items-center justify-between flex-wrap gap-4 mb-8"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold">{index + 4}</span>
                    <a
                      href={
                        explorerUrl
                          ? `${explorerUrl}/address/${address}`
                          : undefined
                      }
                      className="flex items-center gap-2"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Web3Avatar address={address} />
                      <span className="opacity-85">
                        {shortenAddress(address)}
                      </span>
                      {explorerUrl && (
                        <ExternalLink className="w-4 h-4 -ml-1 mt-0.5 fill-text-caption" />
                      )}
                    </a>
                  </div>

                  <div className="ml-auto flex flex-wrap justify-end gap-4 md:gap-12">
                    <EntryDetails entry={entry} />
                  </div>
                </div>
              );
            })}
          </>
        )}
    </div>
  );
};
