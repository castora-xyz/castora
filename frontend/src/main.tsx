import { App } from '@/App.tsx';
import {
  AuthProvider,
  ContractProvider,
  FilterPoolsProvider,
  FirebaseProvider,
  MyActivityProvider,
  PaginatorsProvider,
  PoolsProvider,
  ServerProvider,
  ThemeProvider,
  ToastProvider,
  Web3Provider
} from '@/contexts';
import { PrimeReactProvider } from 'primereact/api';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { CacheProvider } from './contexts/CacheContext';
import './main.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CacheProvider>
      <PaginatorsProvider>
        <PrimeReactProvider value={{ ripple: true }}>
          <ToastProvider>
            <Web3Provider>
              <ThemeProvider>
                <AuthProvider>
                  <ServerProvider>
                    <FirebaseProvider>
                      <ContractProvider>
                        <FilterPoolsProvider>
                          <PoolsProvider>
                            <MyActivityProvider>
                              <App />
                            </MyActivityProvider>
                          </PoolsProvider>
                        </FilterPoolsProvider>
                      </ContractProvider>
                    </FirebaseProvider>
                  </ServerProvider>
                </AuthProvider>
              </ThemeProvider>
            </Web3Provider>
          </ToastProvider>
        </PrimeReactProvider>
      </PaginatorsProvider>
    </CacheProvider>
  </React.StrictMode>
);
