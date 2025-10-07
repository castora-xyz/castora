import { createContext, ReactNode, useContext, useEffect } from 'react';

interface CacheContextProps {}

export const useCache = () => useContext(CacheContext);

const CacheContext = createContext<CacheContextProps>({});

export const CacheProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const clearDb = async () => {
      if ('indexedDB' in window) {
        const dbs = await indexedDB.databases();
        dbs.forEach((database) => {
          if (database.name === 'castora') indexedDB.deleteDatabase('castora');
        });
      }
    };

    clearDb();
  }, []);

  return <CacheContext.Provider value={{}}>{children}</CacheContext.Provider>;
};
