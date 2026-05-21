import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import LoginPage from "@/app/sign-up-login-screen/page";
import DailyCollectionPage from "@/app/daily-collection-entry/page";
import ReportsPage from "@/app/reports/page";
import ParlorMasterPage from "@/app/super-admin/parlor-master/page";
import NotFound from "@/app/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/daily-collection-entry" component={DailyCollectionPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/super-admin/parlor-master" component={ParlorMasterPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster position="bottom-right" richColors closeButton />
    </QueryClientProvider>
  );
}

export default App;
