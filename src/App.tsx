import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAuthToken } from "@/api/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RequireAdmin } from "@/components/layouts/RequireAdmin";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import AdminGoals from "./pages/admin/AdminGoals.tsx";
import AdminSchedule from "./pages/admin/AdminSchedule.tsx";
import AdminBiweekly from "./pages/admin/AdminBiweekly.tsx";
import AdminBetsConfig from "./pages/admin/AdminBetsConfig.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import type { ReactElement } from "react";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: ReactElement }) {
  const token = getAuthToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Index />
              </RequireAuth>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="goals" replace />} />
            <Route path="goals" element={<AdminGoals />} />
            <Route path="schedule" element={<AdminSchedule />} />
            <Route path="biweekly" element={<AdminBiweekly />} />
            <Route path="bets-config" element={<AdminBetsConfig />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
