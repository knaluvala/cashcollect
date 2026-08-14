import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import LoginPage from "@/app/sign-up-login-screen/page";
import DailyCollectionPage from "@/app/daily-collection-entry/page";
import ReportsPage from "@/app/reports/page";
import ParlorMasterPage from "@/app/super-admin/parlor-master/page";
import RouteMasterPage from "@/app/super-admin/route-master/page";
import UserManagementPage from "@/app/user-management/page";
import NotificationsPage from "@/app/notifications/page";
import SettingsPage from "@/app/settings/page";
import NotFound from "@/app/not-found";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const queryClient = new QueryClient();

/** Redirect logged-in users away from the login page to their home */
function LoginRoute() {
  const { user } = useAuth();
  if (user) return <Redirect to="/daily-collection-entry" />;
  return <LoginPage />;
}

/** Any authenticated user — redirects to login if not signed in */
function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user } = useAuth();
  if (!user) return <Redirect to="/" />;
  return <Component />;
}

/** Super-admin only — redirects to login or daily-collection for lesser roles */
function SuperAdminRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user } = useAuth();
  if (!user) return <Redirect to="/" />;
  if (user.role !== "superadmin")
    return <Redirect to="/daily-collection-entry" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={LoginRoute} />

      {/* All authenticated users */}
      <Route path="/daily-collection-entry">
        {() => <ProtectedRoute component={DailyCollectionPage} />}
      </Route>
      <Route path="/reports">
        {() => <ProtectedRoute component={ReportsPage} />}
      </Route>
      <Route path="/notifications">
        {() => <ProtectedRoute component={NotificationsPage} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={SettingsPage} />}
      </Route>

      {/* Super-admin only */}
      <Route path="/super-admin/parlor-master">
        {() => <SuperAdminRoute component={ParlorMasterPage} />}
      </Route>
      <Route path="/super-admin/route-master">
        {() => <SuperAdminRoute component={RouteMasterPage} />}
      </Route>
      <Route path="/user-management">
        {() => <SuperAdminRoute component={UserManagementPage} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster position="bottom-right" richColors closeButton />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
