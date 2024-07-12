import { BottomNav, Footer, Header } from '@/components';
import { useFirebase } from '@/contexts';
import {
  LandingPage,
  LivePoolsPage,
  MyActivityPage,
  NotFoundPage,
  PoolDetailPage
} from '@/pages';
import { ReactNode, useEffect } from 'react';
import {
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
      '/predictions': 'Predictions',
      '/activity': 'Activity'
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
          (location.pathname === '/' ? '' : ' p-8 pb-16')
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
    <Route
      path="/"
      element={<Layout outlet={<Outlet />} />}
      errorElement={<Layout outlet={<NotFoundPage />} />}
    >
      <Route errorElement={<NotFoundPage />}>
        <Route index element={<LandingPage />} />
        <Route path="pools" element={<LivePoolsPage />} />
        <Route path="pool/:poolId" element={<PoolDetailPage />} />
        <Route path="predictions" element={<MyActivityPage />} />
        <Route path="activity" element={<MyActivityPage />} />
      </Route>
    </Route>
  )
);

export const App = () => {
  return <RouterProvider router={router} />;
};
