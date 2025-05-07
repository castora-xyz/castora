import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState
} from 'react';

export const ALL_PREDICATION_TOKENS = ['ETH', 'SOL', 'HYPE'];
export const ALL_STAKE_TOKENS = ['MON', 'gMON'];
export const ALL_STATUSES = ['Open', 'Closed', 'Completed', 'Upcoming'];
export const ALL_POOL_LIFES = ['6h', '24h'];

export interface FilterPoolsProps {
  predictionTokens: string[];
  stakeTokens: string[];
  statuses: string[];
  poolLifes: string[];
}

interface FilterPoolsContextProps extends FilterPoolsProps {
  togglePoolLife: (life: string) => void;
  togglePredictionToken: (token: string) => void;
  toggleStakeToken: (token: string) => void;
  toggleStatus: (status: string) => void;
}

const FilterPoolsContext = createContext<FilterPoolsContextProps>({
  predictionTokens: [],
  stakeTokens: [],
  statuses: [],
  poolLifes: [],
  togglePoolLife: () => {},
  togglePredictionToken: () => {},
  toggleStakeToken: () => {},
  toggleStatus: () => {}
});

export const useFilterPools = () => useContext(FilterPoolsContext);

export const FilterPoolsProvider = ({ children }: { children: ReactNode }) => {
  const retrieveOne = (key: string, all: any[], initial: any[]): any[] => {
    const saved = localStorage.getItem(`castora::filterpools::${key}`);
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

  const [predictionTokens, setPredictionTokens] = useState(
    retrieveOne('predictiontokens', ALL_PREDICATION_TOKENS, [
      'ETH',
      'SOL',
      'HYPE'
    ])
  );
  const [stakeTokens, setStakeTokens] = useState(
    retrieveOne('staketokens', ALL_STAKE_TOKENS, ['MON', 'gMON'])
  );
  const [statuses, setStatuses] = useState(
    retrieveOne('statuses', ALL_STATUSES, ['Open'])
  );
  const [poolLifes, setPoolLifes] = useState(
    retrieveOne('poollifes', ALL_POOL_LIFES, ['6h', '24h'])
  );

  const togglePoolLife = (life: string) => {
    setPoolLifes(
      poolLifes.includes(life)
        ? (prev) => prev.filter((l) => l !== life)
        : (prev) => [...prev, life]
    );
  };

  const togglePredictionToken = (token: string) => {
    setPredictionTokens(
      predictionTokens.includes(token)
        ? (prev) => prev.filter((t) => t !== token)
        : (prev) => [...prev, token]
    );
  };

  const toggleStakeToken = (token: string) => {
    setStakeTokens(
      stakeTokens.includes(token)
        ? (prev) => prev.filter((t) => t !== token)
        : (prev) => [...prev, token]
    );
  };

  const toggleStatus = (status: string) => {
    setStatuses(
      statuses.includes(status)
        ? (prev) => prev.filter((s) => s !== status)
        : (prev) => [...prev, status]
    );
  };

  const retrieve = () => {
    setPredictionTokens(
      retrieveOne('predictiontokens', ALL_PREDICATION_TOKENS, [
        'ETH',
        'SOL',
        'HYPE'
      ])
    );
    setStakeTokens(
      retrieveOne('staketokens', ALL_STAKE_TOKENS, ['MON', 'gMON'])
    );
    setStatuses(retrieveOne('statuses', ALL_STATUSES, ['Open']));
    setPoolLifes(retrieveOne('poollifes', ALL_POOL_LIFES, ['6h', '24h']));
  };

  const save = (key: string, value: string[]) => {
    localStorage.setItem(`castora::filterpools::${key}`, JSON.stringify(value));
  };

  useEffect(() => {
    save('predictiontokens', predictionTokens);
  }, [predictionTokens]);

  useEffect(() => {
    save('poollifes', poolLifes);
  }, [poolLifes]);

  useEffect(() => {
    save('staketokens', stakeTokens);
  }, [stakeTokens]);

  useEffect(() => {
    save('statuses', statuses);
  }, [statuses]);

  useEffect(() => {
    retrieve();
    window.addEventListener('storage', retrieve);
  }, []);

  return (
    <FilterPoolsContext.Provider
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
    </FilterPoolsContext.Provider>
  );
};
