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
const PorDia = lazy(() => import("./pages/PorDia"));
const Ranking = lazy(() => import("./pages/Ranking"));
const Kpis = lazy(() => import("./pages/Kpis"));
const SquadBet = lazy(() => import("./pages/SquadBet"));
const Torneio = lazy(() => import("./pages/Torneio"));
const Relatorio = lazy(() => import("./pages/Relatorio"));
const RelatorioAssessor = lazy(() => import("./pages/RelatorioAssessor"));
const TvPage = lazy(() => import("./pages/Tv"));
const PresentationPage = lazy(() => import("./pages/Presentation"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminGoals = lazy(() => import("./pages/admin/AdminGoals"));
const AdminScoring = lazy(() => import("./pages/admin/AdminScoring"));
const AdminPenalties = lazy(() => import("./pages/admin/AdminPenalties"));
const AdminSounds = lazy(() => import("./pages/admin/AdminSounds"));
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

            {/* Modo Apresentação — admin abre em nova janela pra usar em
                reuniões/TV (auth required, controle por keyboard, fullscreen). */}
            <Route
              path="/presentation"
              element={
                <RequireAuth>
                  <PresentationPage />
                </RequireAuth>
              }
            />

            <Route
              path="/"
              element={
                <RequireAuth>
                  <Index />
                </RequireAuth>
              }
            />

            {/* Rotas placeholder do redesign — redirecionam para o conteúdo
                legacy do Index (?view=...) até cada PR de tela substituir
                pela página real. Ver redesign plan §7.
                Sequência: redesign-por-dia, redesign-ranking, redesign-kpis,
                redesign-squad-bet, redesign-torneio, redesign-assessores. */}
            <Route
              path="/por-dia"
              element={
                <RequireAuth>
                  <PorDia />
                </RequireAuth>
              }
            />
            <Route
              path="/ranking"
              element={
                <RequireAuth>
                  <Ranking />
                </RequireAuth>
              }
            />
            <Route
              path="/kpis"
              element={
                <RequireAuth>
                  <Kpis />
                </RequireAuth>
              }
            />
            <Route
              path="/squad-bet"
              element={
                <RequireAuth>
                  <SquadBet />
                </RequireAuth>
              }
            />
            <Route
              path="/torneio"
              element={
                <RequireAuth>
                  <Torneio />
                </RequireAuth>
              }
            />
            <Route
              path="/assessores"
              element={
                <RequireAuth>
                  <Navigate to="/?view=team" replace />
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
              <Route path="scoring" element={<AdminScoring />} />
              <Route path="penalties" element={<AdminPenalties />} />
              <Route path="sounds" element={<AdminSounds />} />
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
