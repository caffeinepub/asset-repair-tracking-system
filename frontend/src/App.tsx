import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import AssetsPage from './pages/AssetsPage';
import RepairTicketsPage from './pages/RepairTicketsPage';
import PartsInventoryPage from './pages/PartsInventoryPage';
import AuditLogPage from './pages/AuditLogPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import { ThemeProvider } from './hooks/useTheme';
import { Loader2 } from 'lucide-react';

function AuthGate() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6 p-8 rounded-xl border border-border bg-card shadow-lg max-w-sm w-full mx-4">
          <img src="/assets/generated/verifone-logo.dim_256x256.png" alt="Rebtekx Logo" className="h-16 w-16 object-contain" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Rebtekx</h1>
            <p className="text-muted-foreground text-sm mt-1">Asset Repair Tracking System</p>
          </div>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <>
      {showProfileSetup && <ProfileSetupModal />}
      <Outlet />
    </>
  );
}

function LoginButton() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <button
      onClick={() => login()}
      disabled={isLoggingIn}
      className="w-full px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {isLoggingIn && <Loader2 className="h-4 w-4 animate-spin" />}
      {isLoggingIn ? 'Logging in...' : 'Login'}
    </button>
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider>
      <Outlet />
    </ThemeProvider>
  ),
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: AuthGate,
});

const layoutRoute = createRoute({
  getParentRoute: () => authRoute,
  id: 'layout',
  component: Layout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: DashboardPage,
});

const assetsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/assets',
  component: AssetsPage,
});

const repairTicketsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/repair-tickets',
  component: RepairTicketsPage,
});

const partsInventoryRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/parts-inventory',
  component: PartsInventoryPage,
});

const auditLogRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/audit-log',
  component: AuditLogPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/reports',
  component: ReportsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/settings',
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  authRoute.addChildren([
    layoutRoute.addChildren([
      dashboardRoute,
      assetsRoute,
      repairTicketsRoute,
      partsInventoryRoute,
      auditLogRoute,
      reportsRoute,
      settingsRoute,
    ]),
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
