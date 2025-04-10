import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import ScheduleManagement from "./pages/ScheduleManagement";
import MessageHistory from "./pages/MessageHistory";
import GroupManagement from "./pages/GroupManagement";
import TemplateManagement from "./pages/TemplateManagement";
import Settings from "./pages/Settings";
import TestSend from "./pages/TestSend";

function Router() {
  const [location] = useLocation();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <Sidebar currentPath={location} />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/schedules" component={ScheduleManagement} />
          <Route path="/history" component={MessageHistory} />
          <Route path="/groups" component={GroupManagement} />
          <Route path="/templates" component={TemplateManagement} />
          <Route path="/settings" component={Settings} />
          <Route path="/test-send" component={TestSend} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
