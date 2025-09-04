import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export const ALL_CRYPTO_PREDICTION_TOKENS = ['BTC', 'ETH', 'SOL', 'PUMP', 'HYPE'];
export const ALL_CRYPTO_STAKE_TOKENS = ['MON', 'gMON', 'aprMON'];
export const ALL_STATUSES = ['Open', 'Closed', 'Completed', 'Upcoming'];
export const ALL_STOCK_PREDICTION_TOKENS = ['AAPL', 'TSLA', 'CRCL'];
export const ALL_CRYPTO_POOL_LIFES = ['6h', '24h'];

export interface FilterStockPoolsProps {
  predictionTokens: string[];
  statuses: string[];
}

export interface FilterCryptoPoolsProps extends FilterStockPoolsProps {
  stakeTokens: string[];
  poolLifes: string[];
}

interface FilterStockPoolsContextProps extends FilterStockPoolsProps {
  togglePredictionToken: (token: string) => void;
  toggleStatus: (status: string) => void;
}

const FilterStockPoolsContext = createContext<FilterStockPoolsContextProps>({
  predictionTokens: [],
  statuses: [],
  togglePredictionToken: () => {},
  toggleStatus: () => {}
});

interface FilterCryptoPoolsContextProps extends FilterCryptoPoolsProps {
  togglePoolLife: (life: string) => void;
  togglePredictionToken: (token: string) => void;
  toggleStakeToken: (token: string) => void;
  toggleStatus: (status: string) => void;
}

const FilterCryptoPoolsContext = createContext<FilterCryptoPoolsContextProps>({
  predictionTokens: [],
  stakeTokens: [],
  statuses: [],
  poolLifes: [],
  togglePoolLife: () => {},
  togglePredictionToken: () => {},
  toggleStakeToken: () => {},
  toggleStatus: () => {}
});

export const useFilterStockPools = () => useContext(FilterStockPoolsContext);

export const useFilterCryptoPools = () => useContext(FilterCryptoPoolsContext);

const retrieveOne = (key: string, prop: string, all: any[], initial: any[]): any[] => {
  const saved = localStorage.getItem(`castora::filter-v3-${key}pools::${prop}`);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.every((p) => all.includes(p))) {
        return parsed;
      }
    } catch (_) {}
  }
  return initial;
};

const save = (key: string, prop: string, value: string[]) => {
  localStorage.setItem(`castora::filter-v3-${key}pools::${prop}`, JSON.stringify(value));
};

export const FilterStockPoolsProvider = ({ children }: { children: ReactNode }) => {
  const [predictionTokens, setPredictionTokens] = useState(
    retrieveOne('stock', 'predictiontokens', ALL_STOCK_PREDICTION_TOKENS, ['AAPL', 'TSLA', 'CRCL'])
  );
  const [statuses, setStatuses] = useState(retrieveOne('stock', 'statuses', ALL_STATUSES, ['Open']));

  const togglePredictionToken = (token: string) => {
    setPredictionTokens(
      predictionTokens.includes(token) ? (prev) => prev.filter((t) => t !== token) : (prev) => [...prev, token]
    );
  };

  const toggleStatus = (status: string) => {
    setStatuses(statuses.includes(status) ? (prev) => prev.filter((s) => s !== status) : (prev) => [...prev, status]);
  };

  const retrieve = () => {
    setPredictionTokens(
      retrieveOne('stock', 'predictiontokens', ALL_CRYPTO_PREDICTION_TOKENS, ['AAPL', 'TSLA', 'CRCL'])
    );
    setStatuses(retrieveOne('stock', 'statuses', ALL_STATUSES, ['Open']));
  };

  useEffect(() => {
    save('stock', 'predictiontokens', predictionTokens);
  }, [predictionTokens]);

  useEffect(() => {
    save('stock', 'statuses', statuses);
  }, [statuses]);

  useEffect(() => {
    retrieve();
    window.addEventListener('storage', retrieve);

    // Remove saved older filters from browser
    const lsKeys = Object.keys(localStorage);
    for (let key of lsKeys) {
      if (key.startsWith('castora::filterstockpools')) localStorage.removeItem(key);
    }
  }, []);

  return (
    <FilterStockPoolsContext.Provider
      value={{
        predictionTokens,
        statuses,
        togglePredictionToken,
        toggleStatus
      }}
    >
      {children}
    </FilterStockPoolsContext.Provider>
  );
};

export const FilterCryptoPoolsProvider = ({ children }: { children: ReactNode }) => {
  const [predictionTokens, setPredictionTokens] = useState(
    retrieveOne('crypto', 'predictiontokens', ALL_CRYPTO_PREDICTION_TOKENS, ['BTC', 'ETH', 'SOL', 'PUMP', 'HYPE'])
  );
  const [stakeTokens, setStakeTokens] = useState(
    retrieveOne('crypto', 'staketokens', ALL_CRYPTO_STAKE_TOKENS, ['MON', 'gMON', 'aprMON'])
  );
  const [statuses, setStatuses] = useState(retrieveOne('crypto', 'statuses', ALL_STATUSES, ['Open']));
  const [poolLifes, setPoolLifes] = useState(retrieveOne('crypto', 'poollifes', ALL_CRYPTO_POOL_LIFES, ['6h', '24h']));

  const togglePoolLife = (life: string) => {
    setPoolLifes(poolLifes.includes(life) ? (prev) => prev.filter((l) => l !== life) : (prev) => [...prev, life]);
  };

  const togglePredictionToken = (token: string) => {
    setPredictionTokens(
      predictionTokens.includes(token) ? (prev) => prev.filter((t) => t !== token) : (prev) => [...prev, token]
    );
  };

  const toggleStakeToken = (token: string) => {
    setStakeTokens(
      stakeTokens.includes(token) ? (prev) => prev.filter((t) => t !== token) : (prev) => [...prev, token]
    );
  };

  const toggleStatus = (status: string) => {
    setStatuses(statuses.includes(status) ? (prev) => prev.filter((s) => s !== status) : (prev) => [...prev, status]);
  };

  const retrieve = () => {
    setPredictionTokens(
      retrieveOne('crypto', 'predictiontokens', ALL_CRYPTO_PREDICTION_TOKENS, ['ETH', 'SOL', 'HYPE'])
    );
    setStakeTokens(retrieveOne('crypto', 'staketokens', ALL_CRYPTO_STAKE_TOKENS, ['MON', 'gMON', 'aprMON']));
    setStatuses(retrieveOne('crypto', 'statuses', ALL_STATUSES, ['Open']));
    setPoolLifes(retrieveOne('crypto', 'poollifes', ALL_CRYPTO_POOL_LIFES, ['6h', '24h']));
  };

  useEffect(() => {
    save('crypto', 'predictiontokens', predictionTokens);
  }, [predictionTokens]);

  useEffect(() => {
    save('crypto', 'poollifes', poolLifes);
  }, [poolLifes]);

  useEffect(() => {
    save('crypto', 'staketokens', stakeTokens);
  }, [stakeTokens]);

  useEffect(() => {
    save('crypto', 'statuses', statuses);
  }, [statuses]);

  useEffect(() => {
    retrieve();
    window.addEventListener('storage', retrieve);

    // Remove saved older filters from browser
    const lsKeys = Object.keys(localStorage);
    for (let key of lsKeys) {
      if (key.startsWith('castora::filterpools')) localStorage.removeItem(key);
      if (key.startsWith('castora::filtercryptopools')) localStorage.removeItem(key);
      if (key.startsWith('castora::filter-v2-cryptopools')) localStorage.removeItem(key);
      if (key.startsWith('castora::filter-v2-stockpools')) localStorage.removeItem(key);
    }
  }, []);

  return (
    <FilterCryptoPoolsContext.Provider
      value={{
        predictionTokens,
        stakeTokens,
        statuses,
        poolLifes,
        togglePoolLife,
        togglePredictionToken,
        toggleStakeToken,
        toggleStatus
      }}
    >
      {children}
    </FilterCryptoPoolsContext.Provider>
  );
};
