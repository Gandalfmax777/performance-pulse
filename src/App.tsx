import { lazy, Suspense, type ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAuthToken } from "@/api/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RequireAdmin } from "@/components/layouts/RequireAdmin";
import FullScreenLoader from "@/components/ui/FullScreenLoader";

// Páginas lazy: cada rota vira seu próprio chunk, reduzindo bundle inicial.
// /admin/* é usado só por admins mas era baixado junto — agora só quando navega.
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Relatorio = lazy(() => import("./pages/Relatorio"));
const RelatorioAssessor = lazy(() => import("./pages/RelatorioAssessor"));
const TvPage = lazy(() => import("./pages/Tv"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminGoals = lazy(() => import("./pages/admin/AdminGoals"));
const AdminSchedule = lazy(() => import("./pages/admin/AdminSchedule"));
const AdminBiweekly = lazy(() => import("./pages/admin/AdminBiweekly"));
const AdminBetsConfig = lazy(() => import("./pages/admin/AdminBetsConfig"));
const AdminTournaments = lazy(() => import("./pages/admin/AdminTournaments"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));

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
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<FullScreenLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* TV pública (sem auth) — kiosk mode pra mesa de vendas.
                apiFetch detecta /tv e não anexa token / não redireciona em 401.
                Endpoints consumidos são públicos no backend (ver routes/*.ts). */}
            <Route path="/tv" element={<TvPage />} />

            <Route
              path="/"
              element={
                <RequireAuth>
                  <Index />
                </RequireAuth>
              }
            />

            {/* Relatório PDF dedicado (auth obrigatório) */}
            <Route
              path="/relatorio"
              element={
                <RequireAuth>
                  <Relatorio />
                </RequireAuth>
              }
            />
            <Route
              path="/relatorio/assessor/:id"
              element={
                <RequireAuth>
                  <RelatorioAssessor />
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
              <Route path="tournaments" element={<AdminTournaments />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
  </ErrorBoundary>
);

export default App;
