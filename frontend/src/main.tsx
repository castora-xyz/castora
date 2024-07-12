import { App } from '@/App.tsx';
import {
  AuthProvider,
  ContractProvider,
  FirebaseProvider,
  MyActivityProvider,
  PoolsProvider,
  ServerProvider,
  ThemeProvider,
  ToastProvider,
  Web3Provider
} from '@/contexts';
import { PrimeReactProvider } from 'primereact/api';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './main.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrimeReactProvider value={{ ripple: true }}>
      <ToastProvider>
        <Web3Provider>
          <ThemeProvider>
            <AuthProvider>
              <ServerProvider>
                <FirebaseProvider>
                  <ContractProvider>
                    <PoolsProvider>
                      <MyActivityProvider>
                        <App />
                      </MyActivityProvider>
                    </PoolsProvider>
                  </ContractProvider>
                </FirebaseProvider>
              </ServerProvider>
            </AuthProvider>
          </ThemeProvider>
        </Web3Provider>
      </ToastProvider>
    </PrimeReactProvider>
  </React.StrictMode>
);
