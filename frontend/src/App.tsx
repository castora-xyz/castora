import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import { useFirebase } from '@/contexts';
import LivePoolsPage from '@/pages/LivePoolsPage';
import NotFoundPage from '@/pages/NotFoundPage';
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
      <main className="p-8 pb-16 grow flex flex-col items-stretch">
        {outlet}
      </main>
      <BottomNav />
      <ScrollRestoration getKey={(location) => location.pathname} />
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
        <Route index element={<LivePoolsPage />}></Route>
        <Route path="pools" element={<LivePoolsPage />}></Route>
        <Route
          path="pool/:poolId"
          lazy={() => import('@/pages/PoolDetailPage')}
        ></Route>
        <Route
          path="predictions"
          lazy={() => import('@/pages/MyActivityPage')}
        ></Route>
        <Route
          path="activity"
          lazy={() => import('@/pages/MyActivityPage')}
        ></Route>
      </Route>
    </Route>
  )
);
export default function App() {
  return <RouterProvider router={router} />;
}
