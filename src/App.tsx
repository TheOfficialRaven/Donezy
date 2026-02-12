import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAppStore } from "@/stores/useAppStore";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AppShell from "./components/AppShell";
import Dashboard from "./pages/app/Dashboard";
import Quests from "./pages/app/Quests";
import Lists from "./pages/app/Lists";
import Notes from "./pages/app/Notes";
import Calendar from "./pages/app/Calendar";
import Achievements from "./pages/app/Achievements";
import Shop from "./pages/app/Shop";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

const queryClient = new QueryClient();

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((s) => s.initAuth);
  const initializeForUser = useAppStore((s) => s.initializeForUser);
  const cleanup = useAppStore((s) => s.cleanup);

  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

  // Initialize app store when user changes
  const user = useAuthStore((s) => s.user);
  useEffect(() => {
    if (user) {
      initializeForUser(user.uid);
    } else {
      cleanup();
    }
  }, [user, initializeForUser, cleanup]);

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--surface-1))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--text-primary))',
          }
        }}
      />
      <PWAInstallPrompt />
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="quests" element={<Quests />} />
              <Route path="lists" element={<Lists />} />
              <Route path="notes" element={<Notes />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="achievements" element={<Achievements />} />
              <Route path="shop" element={<Shop />} />
            </Route>
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
