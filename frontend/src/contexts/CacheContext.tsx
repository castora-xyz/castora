import { openDB } from 'idb';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState
} from 'react';

interface CacheContextProps {
  retrieve: (key: string) => Promise<any>;
  save: (key: string, value: any) => Promise<void>;
}

export const useCache = () => useContext(CacheContext);

const CacheContext = createContext<CacheContextProps>({
  retrieve: async () => {},
  save: async () => {}
});

export const CacheProvider = ({ children }: { children: ReactNode }) => {
  const [db, setDb] = useState<any>(null);

  useEffect(() => {
    const useDb = async () => {
      if (!('indexedDB' in window)) return null;
      const db = await openDB('castora', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('cache')) {
            db.createObjectStore('cache');
          }
        }
      });
      setDb(db);
    };

    useDb();
  }, []);

  const retrieve = async (key: string) => {
    return db ? await db.get('cache', key) : null;
  };

  const save = async (key: string, value: any) => {
    if (db) {
      const tx = db.transaction('cache', 'readwrite');
      await Promise.all([tx.store.put(value, key), tx.done]);
    }
  };

  return (
    <CacheContext.Provider value={{ retrieve, save }}>
      {children}
    </CacheContext.Provider>
  );
};
