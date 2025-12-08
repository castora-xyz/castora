import { App } from '@/App.tsx';
import {
  AuthProvider,
  ContractProvider,
  CurrentTimeProvider,
  FilterCommunityPoolsProvider,
  FilterCryptoPoolsProvider,
  FilterStockPoolsProvider,
  FirebaseProvider,
  LeaderboardProvider,
  MyCreateActivityProvider,
  MyPredictActivityProvider,
  PaginatorsProvider,
  PoolsProvider,
  PoolsShimmerProvider,
  ServerProvider,
  TelegramProvider,
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
    <CurrentTimeProvider>
      <CacheProvider>
        <PaginatorsProvider>
          <PrimeReactProvider value={{ ripple: true }}>
            <ToastProvider>
              <Web3Provider>
                <ThemeProvider>
                  <AuthProvider>
                    <ServerProvider>
                      <FirebaseProvider>
                        <TelegramProvider>
                          <ContractProvider>
                            <FilterCryptoPoolsProvider>
                              <FilterStockPoolsProvider>
                                <FilterCommunityPoolsProvider>
                                  <PoolsProvider>
                                    <PoolsShimmerProvider>
                                      <MyPredictActivityProvider>
                                        <MyCreateActivityProvider>
                                          <LeaderboardProvider>
                                            <App />
                                          </LeaderboardProvider>
                                        </MyCreateActivityProvider>
                                      </MyPredictActivityProvider>
                                    </PoolsShimmerProvider>
                                  </PoolsProvider>
                                </FilterCommunityPoolsProvider>
                              </FilterStockPoolsProvider>
                            </FilterCryptoPoolsProvider>
                          </ContractProvider>
                        </TelegramProvider>
                      </FirebaseProvider>
                    </ServerProvider>
                  </AuthProvider>
                </ThemeProvider>
              </Web3Provider>
            </ToastProvider>
          </PrimeReactProvider>
        </PaginatorsProvider>
      </CacheProvider>
    </CurrentTimeProvider>
  </React.StrictMode>
);
