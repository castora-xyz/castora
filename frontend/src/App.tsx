import { BottomNav, Footer, Header } from '@/components';
import { useFirebase } from '@/contexts';
import {
  CreateCommunityPoolPage,
  LandingPage,
  LeaderboardPage,
  LiveCommunityPoolsPage,
  LiveCryptoPoolsPage,
  LiveStocksPoolsPage,
  MainnetPoolsPage,
  MyActivityCreatedPoolsPage,
  MyActivityPredictionsPage,
  NotFoundPage,
  PoolDetailPage
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

const Layout = ({ outlet }: { outlet: ReactNode }) => {
  const { recordNavigation } = useFirebase();
  const location = useLocation();

  useEffect(() => {
    const names: { [key: string]: string } = {
      '/': 'Home',
      '/pools': 'Pools',
      '/pools/crypto': 'Crypto Pools',
      '/pools/stocks': 'Stocks Pools',
      '/pools/community': 'Community Pools',
      '/leaderboard': 'Leaderboard',
      '/activity/predictions': 'My Activity - Predictions',
      '/activity/created-pools': 'My Activity - Created Pools'
    };
    let name = names[location.pathname];
    if (!name && location.pathname.startsWith('/pool/')) name = 'Pool Detail';
    if (!name) name = 'Not Found';
    recordNavigation(location.pathname, name);
  }, [location]);

  return (
    <>
      <Header />
      <main
        className={
          'grow flex flex-col items-stretch' +
          (location.pathname === '/' || location.pathname === '/pools/community/create'
            ? ''
            : ' max-[414px]:px-4 px-8 pb-16')
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
        <Route path="pools" element={<MainnetPoolsPage />} />
        <Route path="pools/crypto" element={<LiveCryptoPoolsPage />} />
        <Route path="pools/stocks" element={<LiveStocksPoolsPage />} />
        <Route path="pools/community" element={<LiveCommunityPoolsPage />} />
        <Route path="pools/community/create" element={<CreateCommunityPoolPage />} />
        <Route path="pool/:poolId" element={<PoolDetailPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="predictions" element={<Navigate to="/activity/predictions" />} />
        <Route path="stocks" element={<LiveStocksPoolsPage />} />
        <Route path="activity" element={<Navigate to="predictions" replace />} />
        <Route path="activity/predictions" element={<MyActivityPredictionsPage />} />
        <Route path="activity/created-pools" element={<MyActivityCreatedPoolsPage />} />
      </Route>
    </Route>
  )
);

export const App = () => {
  return <RouterProvider router={router} />;
};
