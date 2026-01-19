import { BottomNav, Footer, Header } from '@/components';
import { useFirebase } from '@/contexts';
import {
  CreateCommunityPoolPage,
  LandingPage,
  LeaderboardPage,
  LiveStocksPoolsPage,
  MainnetPoolsPage,
  MyActivityCreatedPoolsPage,
  MyActivityPredictionsPage,
  NotFoundPage,
  PoolDetailPage,
  PrivacyPage,
  TermsPage
} from '@/pages';
import { ReactNode, useEffect } from 'react';
import {
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  ScrollRestoration,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation
} from 'react-router-dom';
import { useConnection } from 'wagmi';

const Layout = ({ outlet }: { outlet: ReactNode }) => {
  const { recordNavigation } = useFirebase();
  const location = useLocation();
  const { chain: currentChain} = useConnection();

  const chainName = currentChain?.name.toLowerCase() ?? 'monad';
  useEffect(() => {
    const names: { [key: string]: string } = {
      '/': 'Home',
      [`/${chainName}/pools`]: 'Pools',
      [`/${chainName}/pools/crypto`]: 'Crypto Pools',
      [`/${chainName}/pools/stocks`]: 'Stocks Pools',
      [`/${chainName}/pools/community`]: 'Community Pools',
      [`/${chainName}/leaderboard`]: 'Leaderboard',
      [`/${chainName}/activity/predictions`]: 'My Activity - Predictions',
      [`/${chainName}/activity/created-pools`]: 'My Activity - Created Pools',
      '/terms': 'Terms of Service',
      '/privacy': 'Privacy Policy'
    };
    let name = names[location.pathname];
    if (!name && location.pathname.startsWith(`/${chainName}/pool/`)) name = 'Pool Detail';
    if (!name) name = 'Not Found';
    recordNavigation(location.pathname, name);
  }, [location, chainName, recordNavigation]);

  return (
    <>
      <Header />
      <main
        className={
          'grow flex flex-col items-stretch' +
          (['/', `/${chainName}/pools`, `/${chainName}/pools/create`].includes(location.pathname) ? '' : ' max-[414px]:px-4 px-8 pb-16')
        }
      >
        {outlet}
      </main>
      <BottomNav />
      <ScrollRestoration />
      <Footer />
    </>
  );
};

const router = createBrowserRouter(
  
  createRoutesFromElements(
    <Route path="/" element={<Layout outlet={<Outlet />} />} errorElement={<Layout outlet={<NotFoundPage />} />}>
      <Route errorElement={<NotFoundPage />}>
        <Route index element={<LandingPage />} />
        <Route path=":chainName/pools" element={<MainnetPoolsPage />} />
        {/* <Route path="pools/crypto" element={<LiveCryptoPoolsPage />} />
        <Route path="pools/stocks" element={<LiveStocksPoolsPage />} />
        <Route path="pools/community" element={<LiveCommunityPoolsPage />} /> */}
        <Route path=":chainName/pools/create" element={<CreateCommunityPoolPage />} />
        <Route path=":chainName/pool/:poolId" element={<PoolDetailPage />} />
        <Route path=":chainName/leaderboard" element={<LeaderboardPage />} />
        <Route path=":chainName/predictions" element={<Navigate to="/activity/predictions" />} />
        <Route path=":chainName/stocks" element={<LiveStocksPoolsPage />} />
        <Route path=":chainName/activity" element={<Navigate to="predictions" replace />} />
        <Route path=":chainName/activity/predictions" element={<MyActivityPredictionsPage />} />
        <Route path=":chainName/activity/created-pools" element={<MyActivityCreatedPoolsPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
      </Route>
    </Route>
  )
);

export const App = () => {
  return <RouterProvider router={router} />;
};
