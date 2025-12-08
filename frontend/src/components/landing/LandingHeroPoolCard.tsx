import ArrowRight from '@/assets/arrow-right.svg?react';
import { CountdownNumbers } from '@/components';
import { landingPageDefaults, Pool } from '@/schemas';
import { PriceServiceConnection } from '@pythnetwork/price-service-client';
import ms from 'ms';
import { Ripple } from 'primereact/ripple';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const LandingHeroPoolCard = ({ pool }: { pool: Pool | null }) => {
  const connection = new PriceServiceConnection('https://hermes.pyth.network');

  const [basePrice, setBasePrice] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [mins, setMins] = useState(0);
  const [priceDiffPercent, setPriceDiffPercent] = useState(0);

  useEffect(() => {
    if (basePrice !== 0) {
      setPriceDiffPercent(
        parseFloat((((currentPrice - basePrice) / basePrice) * 100).toFixed(2))
      );
    } else setPriceDiffPercent(0);
  }, [currentPrice, basePrice]);

  useEffect(() => {
    (async () => {
      try {
        const baseTimeDiff =
          pool?.seeds.poolLife() ?? landingPageDefaults.baseTimeDiff;
        const priceData = await connection.getPriceFeed(
          pool?.seeds.predictionTokenDetails.pythPriceId ??
            landingPageDefaults.pythPriceId,
          Math.trunc(Date.now() / 1000) - baseTimeDiff
        );
        const { price, expo } = priceData.getPriceUnchecked();
        const formatted = parseFloat(
          (+price * 10 ** expo).toFixed(Math.abs(expo) < 8 ? Math.abs(expo) : 8)
        );
        setBasePrice(formatted);
      } catch (e) {
        setBasePrice(0);
      }
    })();
    const interval = setInterval(() => setMins(mins + 1), 60000);
    return () => clearInterval(interval);
  }, [mins, pool]);

  useEffect(() => {
    connection.subscribePriceFeedUpdates(
      [
        pool?.seeds.predictionTokenDetails.pythPriceId ??
          landingPageDefaults.pythPriceId
      ],
      (priceFeed) => {
        const { price, expo } = priceFeed.getPriceUnchecked();
        setCurrentPrice(
          parseFloat(
            (+price * 10 ** expo).toFixed(
              Math.abs(expo) < 8 ? Math.abs(expo) : 8
            )
          )
        );
      }
    );
    return () => connection.closeWebSocket();
  }, [pool]);

  return (
    <div className="border border-border-default dark:border-surface-disabled p-8 bg-app-bg w-full rounded-[24px]">
      <div className="mb-8">
        <p className="font-medium text-xs sm:text-base text-text-disabled text-right">
          Building on Monad
        </p>
        <p className="font-medium text-xs sm:text-base text-text-disabled text-right mb-2">
          Powered by PYTH
        </p>

        <div className="flex gap-2 sm:gap-3 items-start">
          <img
            src={`/assets/${
              pool?.seeds.predictionTokenDetails.img ??
              landingPageDefaults.pairImg
            }.png`}
            className="w-8 sm:w-12 h-8 sm:h-12 rounded-full"
          />

          <div>
            <div className="font-bold text-lg sm:text-2xl text-text-title">
              {pool?.seeds.pairNameSpaced() ?? landingPageDefaults.pairName}
            </div>
            <div className="font-medium sm:text-lg text-text-caption">
              {pool?.seeds.pairNameFull() ?? landingPageDefaults.pairNameFull}
            </div>
          </div>
        </div>
      </div>

      <p className="font-medium text-text-subtitle mb-2">Current Price</p>
      <p className="text-4xl md:text-5xl text-text-title mb-1">
        {currentPrice} USD
      </p>

      {priceDiffPercent !== 0 && currentPrice !== 0 && (
        <p
          className={
            'font-medium mb-8 ' +
            (priceDiffPercent < 0
              ? 'text-errors-default'
              : 'text-success-default')
          }
        >
          {priceDiffPercent > 0 ? '+' : ''}
          {priceDiffPercent}% in the last{' '}
          {ms(
            (pool?.seeds.poolLife() ?? landingPageDefaults.baseTimeDiff) * 1000
          )}
        </p>
      )}

      <div className="sm:flex justify-between">
        {!!pool &&
        pool.seeds.windowCloseTime > Math.trunc(Date.now() / 1000) ? (
          <div>
            <p className="font-medium text-text-subtitle mb-2">
              Pool Closes In
            </p>

            <p className="py-1.5 px-4 font-medium rounded-full w-fit  bg-surface-subtle text-text-title sm:mb-4">
              <CountdownNumbers timestamp={pool.seeds.windowCloseTime} />
            </p>
          </div>
        ) : (
          <div>
            {/* Added this empty div to always force the next button to*/}
            {/* stay to the right in wide screens */}
          </div>
        )}

        <Link
          to={!!pool ? '/pool/' + pool.poolId : '/pools'}
          className="py-2 px-6 rounded-full bg-primary-default border-2 border-primary-lighter font-medium text-lg text-white p-ripple self-end h-fit flex items-center justify-center max-sm:mt-8"
        >
          {!!pool ? 'Join Pool' : 'Live Pools'}
          <ArrowRight className="w-6 h-6 ml-2 fill-white" />
          <Ripple />
        </Link>
      </div>
    </div>
  );
};
