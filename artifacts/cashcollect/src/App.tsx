import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import LoginPage from "@/app/sign-up-login-screen/page";
import DailyCollectionPage from "@/app/daily-collection-entry/page";
import ReportsPage from "@/app/reports/page";
import ParlorMasterPage from "@/app/super-admin/parlor-master/page";
import UserManagementPage from "@/app/user-management/page";
import NotificationsPage from "@/app/notifications/page";
import SettingsPage from "@/app/settings/page";
import NotFound from "@/app/not-found";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const queryClient = new QueryClient();

function SuperAdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  if (!user || user.role !== 'superadmin') return <Redirect to="/daily-collection-entry" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/daily-collection-entry" component={DailyCollectionPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/super-admin/parlor-master">
        {() => <SuperAdminRoute component={ParlorMasterPage} />}
      </Route>
      <Route path="/user-management">
        {() => <SuperAdminRoute component={UserManagementPage} />}
      </Route>
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/settings" component={SettingsPage} />
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
