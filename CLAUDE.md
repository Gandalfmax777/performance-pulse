# Performance Pulse — Frontend (Vite)

SPA do dashboard de gamificação. Felipe (sócio) e gerentes logam via JWT; consome o backend Fastify do sub-repo irmão `performance-pulse-backend`. Multi-tenant em runtime (mesma instância serve EQI, BDN, etc.) — o tenant ativo vem dentro do JWT.

> Este arquivo é frontend-only. O `../CLAUDE.md` (pai) cobre o overview cross-stack, domínio Prisma, RAG/MCP e backend.

## Stack

Versões reais do `package.json`:

- React **18.3** + react-dom 18.3 + react-router-dom **6.30** (todas as rotas `lazy()`)
- Vite **5.4** com `@vitejs/plugin-react-swc` 3.11
- TypeScript **5.8** intencionalmente lax (ver "Convenções")
- ESLint **9** flat config + typescript-eslint 8
- Tailwind **3.4** + `tailwindcss-animate` + `tailwindcss-typography`
- shadcn/ui (Radix Primitives: 24 pacotes `@radix-ui/*`)
- Tanstack Query **5.83** (server-state cache + invalidation)
- react-hook-form **7.61** + `@hookform/resolvers` 3.10 + Zod **3.25**
- recharts **2.15** (charts), framer-motion **12** (animação), Phosphor Icons **2.1**
- next-themes 0.3 (light fixo, dark desligado), sonner 1.7 (toasts), cmdk, vaul, embla-carousel
- date-fns **3.6**, react-markdown 10, react-day-picker, input-otp
- Vitest **3.2** + Testing Library 16 + jsdom 20 + Playwright 1.57 (dev-only)
- Deploy oficial: Docker+nginx (`Dockerfile` + `nginx.conf`) → GHCR → Coolify VPS via `.github/workflows/deploy.yml`. `vercel.json` existe mas o workflow não o usa.

## Estrutura de `src/`

```
api/                   client.ts (apiFetch + token) | types.generated.ts (do OpenAPI)
components/
  dashboard/           46 widgets do dashboard (Leaderboard, KpiCards, RegistrationPanel, ...)
  shared/              5 wrappers editoriais — Eyebrow, StatDelta, KpiTile, SectionCard, AdminSubnav (barrel em index.ts) + TenantSwitcher
  ui/                  56 shadcn primitives (gerados pelo CLI shadcn — NÃO editar)
  layouts/             AppShellLayout (sidebar+topbar), RequireAdmin (role guard)
  providers/           TenantProvider (aplica data-tenant em runtime)
  ErrorBoundary.tsx, NavLink.tsx, icons.ts
config/                tenants.ts (TENANT_FALLBACKS estático de EQI/BDN + resolveTenantConfig)
hooks/                 33 hooks — useCurrentUser, useAssessors, useKpis, useRankingStream, ...
lib/                   helpers puros — utils.ts (cn), kpi-meta, levelMeta, biweekly, meetingBonus, sounds, imageResize
pages/                 14 top-level (Login, Index, PorDia, Ranking, Kpis, SquadBet, Torneio, Assessores, Relatorio, RelatorioAssessor, Tv, Presentation, NotFound)
pages/admin/           12 telas — AdminGoals, AdminScoring, AdminPenalties, AdminSounds, AdminSchedule, AdminBiweekly, AdminBetsConfig, AdminTournaments, AdminAnnouncements, AdminUsers, AdminTenants, AdminLayout
types/                 assessor.ts (shape legacy — ver gotcha)
test/                  setup.ts (jest-dom), example.test.ts
main.tsx, App.tsx, index.css, App.css, vite-env.d.ts
```

## Comandos

Todos do `package.json`:

```bash
npm run dev          # Vite em http://localhost:8080  (NÃO 3000)
npm run sync-types   # regenera src/api/types.generated.ts do backend /docs/json — backend precisa estar rodando em :3001
npm run lint         # eslint flat config
npm run test         # vitest run (jsdom + setup.ts)
npm run test:watch
npm run build        # build de produção (Vercel/Docker)
npm run build:dev    # build com mode=development (sourcemaps mais ricos)
npm run preview      # serve o dist localmente
```

## Convenções de código

- **PT-BR** em UI e comentários; código (variáveis, funções, types) em inglês.
- **Alias `@/`** → `./src` (vite + tsconfig). Sempre `import X from "@/..."`, nunca `../../`.
- **Tanstack Query**:
  - 1 hook por entidade em `src/hooks/use<Entity>.ts`.
  - Query keys: `["<entity>", ...filters]` — sempre array com a entidade primeiro. Filtros viram itens subsequentes (ex: `["metrics", { from, to }]` em `useMetrics.ts`).
  - Mutations chamam `qc.invalidateQueries({ queryKey: ["<entity>"] })` no `onSuccess`. Quando a mutation afeta outras entidades, invalida todas (ver `useAssessors.ts:113-115` invalidando `rankings`).
  - `enabled: Boolean(token)` em queries que dependem de auth — evita disparo na rota `/login`.
  - `staleTime` curto (2-3s) + `refetchInterval` (~20s) em hooks que casam com SSE pra dupla garantia de freshness.
  - Padrão CRUD típico (`src/hooks/useTenants.ts`):
    ```ts
    const QUERY_KEY = ["tenants"] as const;

    export function useTenants() {
      const token = getAuthToken();
      return useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => apiFetch<Tenant[]>("/admin/tenants"),
        enabled: Boolean(token),
      });
    }

    export function useUpdateTenant() {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: ({ id, ...input }: UpdateTenantInput & { id: string }) =>
          apiFetch<Tenant>(`/admin/tenants/${id}`, { method: "PATCH", body: input }),
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: QUERY_KEY });
          qc.invalidateQueries({ queryKey: ["currentUser"] }); // tenant pode ter mudado
        },
      });
    }
    ```
  - **Optimistic updates**: raramente usados (server-state confia em SSE/refetch). Quando preciso (ex: drag-drop de prioridade), seguir pattern `onMutate → onError(rollback) → onSettled(invalidate)` da própria docs do Tanstack.
- **HTTP**: tudo via `apiFetch` em `src/api/client.ts`. **Exceção**: uploads de FormData (foto/som/logo) — usam `fetch` cru porque `apiFetch` força `Content-Type: application/json`. Pattern em `useKpis.useUploadKpiSound` (`src/hooks/useKpis.ts:96-118`) e `useTenants.useUploadTenantLogo` (`src/hooks/useTenants.ts:69-95`):
  ```ts
  const token = getAuthToken();
  const res = await fetch(`${API_URL}/.../upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  ```
- **Componentes**:
  - `components/ui/` é shadcn gerado pelo CLI — **não edite à toa**. Pra customizar, wrap localmente ou crie em `components/shared/`.
  - Wrappers editoriais reutilizáveis (eyebrow, kpi tile, stat delta, section card) ficam em `components/shared/` e são exportados pelo barrel `shared/index.ts`.
- **TypeScript intencionalmente lax** (`tsconfig.app.json`):
  ```jsonc
  { "strict": false, "strictNullChecks": false,
    "noImplicitAny": false, "noUnusedLocals": false,
    "noUnusedParameters": false, "noFallthroughCasesInSwitch": false }
  ```
  Não "consertar" tipos pensando que é bug. ESLint também desliga `@typescript-eslint/no-unused-vars` e `@typescript-eslint/no-empty-object-type` (`eslint.config.js:23-25`).
- **Rotas lazy**: cada page é `lazy()` em `App.tsx:16-40` — cada rota vira chunk próprio. Adicionar rota nova segue o mesmo padrão; também considere se precisa virar entry de manualChunks no `vite.config.ts`.
- **Toasters**: dois convivem. **Sempre `sonner` em código novo** (`toast.success/error` direto do import `sonner`). Radix `useToast` é legado.
- **Theme**: `next-themes` em light fixo (`<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>` em `App.tsx:54`). Dark mode existe nas CSS vars do `index.css` mas não está ativo.

## Pontos de entrada críticos

| Arquivo | Por quê |
|---|---|
| `src/main.tsx` | Bootstrap. Render do `<App />` no `#root`, importa `index.css`. |
| `src/App.tsx:42` | `QueryClient` único da app. |
| `src/App.tsx:44-50` | `RequireAuth` inline — só checa token, não busca user. |
| `src/App.tsx:52-198` | Provider tree (`ErrorBoundary > ThemeProvider > QueryClientProvider > TenantProvider > TooltipProvider > BrowserRouter > Suspense > Routes`) e definição das rotas. |
| `src/api/client.ts` | `apiFetch`, `getAuthToken/setAuthToken/clearAuthToken`, `ApiError`, `TOKEN_STORAGE_KEY = "pp_token"`. |
| `src/api/client.ts:55-58` | `isPublicTvRoute()` — bypass auth quando pathname é `/tv` ou `/tv/*`. |
| `src/api/client.ts:109-114` | Em 401 (não-TV): `clearAuthToken()` + `window.location.href = "/login"`. |
| `src/components/providers/TenantProvider.tsx` | `useEffect` aplica `<html data-tenant={slug}>` quando `useCurrentUser` resolve. |
| `src/config/tenants.ts` | `TENANT_FALLBACKS` (EQI/BDN), `resolveTenantConfig(slug, brandConfig)` faz merge `{...fallback, ...brandConfig, slug}`, e `DEFAULT_TENANT_SLUG = "bdn"` é o fallback quando nada mais resolve. |
| `src/hooks/useCurrentUser.ts` | `/auth/me` + `useSwitchTenant` (`POST /auth/switch-tenant`). Retorna `{ user, tenant, tenantConfig, memberships, isAdmin, isSuperAdmin, hasMultipleMemberships }`. |
| `src/hooks/useRankingStream.ts:52-63` | SSE invalida 6 query keys em cascata. |
| `src/components/layouts/RequireAdmin.tsx` | Role guard com loader (evita flash de redirect antes da role chegar). |
| `src/components/layouts/AppShellLayout.tsx` | Shell editorial das rotas internas — sidebar 248px sticky + topbar via render prop. |
| `index.html:2` | `<html data-tenant="eqi">` (default no boot, sobrescrito em runtime). |
| `src/index.css:106-184` | `:root` = paleta EQI default (light). |
| `src/index.css:191-238` | Bloco `[data-tenant="bdn"]`. |
| `vite.config.ts:6-19` | Server porta 8080, alias `@/`, dedupe de react/react-query. |
| `vite.config.ts:24-37` | `manualChunks` — vendor-react/charts/motion/markdown/query/dates. |

## Integração com o backend Fastify

- **URL base**: `import.meta.env.VITE_API_URL` (default `http://localhost:3001/api`). `.env.development` e `.env.example` já têm o default. Em produção (Vercel/Coolify) injetar a URL pública.
- **Token**: `localStorage["pp_token"]` (constante `TOKEN_STORAGE_KEY` em `src/api/client.ts:12`). `apiFetch` injeta `Authorization: Bearer <token>` automaticamente. Login usa `skipAuth: true` (`src/pages/Login.tsx:41`).
- **Last tenant**: `localStorage["pp_last_tenant"]` (`LAST_TENANT_STORAGE_KEY`). Slug do último tenant ativo, persistido pra `/login` saber qual brand renderizar. Setado no `/auth/login` success, `useSwitchTenant`, e sempre que `useCurrentUser` recebe `tenant.slug` de `/auth/me`. NÃO é limpo no logout.
- **401**: `apiFetch` limpa o token e redireciona pra `/login`, **exceto** em `/tv` (rota pública).
- **`/tv` é rota pública**: `apiFetch` detecta `window.location.pathname` e bypassa auth tanto pra anexar token quanto pra redirecionar em 401. Os endpoints consumidos pela TV são públicos no backend. Check é por-chamada (não module-load) pra funcionar com navegação client-side.
- **Forwarding de tenant em `/tv`**: como /tv não tem JWT, o backend `resolveTenantForPublicRoute` cai em "eqi" fallback se não receber `?tenant=`. Pra evitar BDN mostrar dados EQI, `apiFetch` injeta automaticamente `?tenant=<slug>` da URL atual quando estiver em /tv (`src/api/client.ts`, função `getTenantQueryParam`). As hooks não precisam adicionar manualmente — funciona pra qualquer endpoint público.
- **SSE**: `EventSource` em `/api/stream/rankings` (e `/api/stream/tournament-finished`). EventSource **não aceita header custom** — token vai por query param `?token=`. Backend lê do query (compat com middleware legado; stream em si é público agora).
  - Eventos: `ranking:update`, `sound:play`, `connected`, `tournament:finished`.
  - **Debounce 300ms** em `useRankingStream` evita refetch tempestade quando Felipe digita métricas rápido.
  - Padrão do listener (`src/hooks/useRankingStream.ts`):
    ```ts
    useEffect(() => {
      if (!enabled) return;
      const token = getAuthToken();
      const url = token
        ? `${API_URL}/stream/rankings?token=${encodeURIComponent(token)}`
        : `${API_URL}/stream/rankings`;
      const source = new EventSource(url);

      source.addEventListener("ranking:update", () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          qc.invalidateQueries({ queryKey: ["rankings"] });
          qc.invalidateQueries({ queryKey: ["reports"] });
          qc.invalidateQueries({ queryKey: ["assessors"] });
          qc.invalidateQueries({ queryKey: ["metrics"] });
          qc.invalidateQueries({ queryKey: ["badges"] });
          qc.invalidateQueries({ queryKey: ["tournaments"] });
        }, 300);
      });

      source.addEventListener("sound:play", (e) => {
        const { soundUrl } = JSON.parse((e as MessageEvent).data);
        if (soundUrl) playSoundUrl(soundUrl);
      });

      return () => source.close();
    }, [enabled, qc]);
    ```
  - `sound:play` toca som broadcast em **todos** clientes conectados (TV inclusa) via `playSoundUrl(soundUrl)` de `src/lib/sounds.ts` — vem do `KpiSound` no backend (R2-hosted).
  - Onde ativar: `useRankingStream(true)` chamado uma vez em `Index.tsx`, `Tv.tsx`, etc. (componentes top-level de tela tempo-real). Não chamar várias vezes — uma instância por aba já cobre tudo via cache do Tanstack.
- **Tipos cross-stack**: `src/api/types.generated.ts` é gerado por `npm run sync-types` que chama `openapi-typescript http://localhost:3001/docs/json -o ...`. É **committado** no repo (Vercel não precisa do backend no build). **Nunca edite manualmente.**
- **Multi-tenant**: tenant ativo dentro do JWT. `useCurrentUser` busca `/auth/me` e retorna `{ user, tenant, memberships }`. `useSwitchTenant` (`POST /auth/switch-tenant`) retorna novo token, persiste no localStorage, atualiza `currentUser` via `qc.setQueryData(...)`, e dispara `qc.invalidateQueries()` global pra refetch tudo tenant-scoped.

## Multi-tenant em runtime

Pipeline:

1. Login → JWT carrega slug do tenant ativo.
2. `useCurrentUser` busca `/auth/me` (staleTime: Infinity).
3. `TenantProvider` faz `document.documentElement.setAttribute("data-tenant", slug)`.
4. CSS vars do bloco `[data-tenant="<slug>"]` em `src/index.css` ativam toda a paleta.
5. Componentes que leem `tenantConfig.primaryColor`, `displayFont`, `logoUrl` (via `useCurrentUser`) renderizam com brand do tenant.

`resolveTenantConfig(slug, brandConfig)` faz merge `{...TENANT_FALLBACKS[safeSlug], ...brandConfig, slug}` — o fallback garante que UI nunca quebra se o admin esquecer campos no painel `/admin/tenants`. Slug desconhecido cai pra `eqi`.

### Rotas públicas (`/tv`) — slug obrigatório via query string

`/tv` não tem JWT → não pode usar `useCurrentUser`. A plataforma roda em domínio único (BDN hospeda todos os tenants), então a diferenciação é só pelo query param na URL: `?tenant=eqi` ou `?tenant=bdn`.

- **Sem fallback**: `/tv` sem `?tenant=` (ou com slug inválido) renderiza tela `TvMissingTenant` no estilo NotFound (404-like) com links pros tenants conhecidos — em vez de silenciosamente cair em EQI. Decisão pra evitar TV BDN mostrar dados EQI por engano.
- **Forwarding pro backend**: quando o slug está presente, `apiFetch` (em `src/api/client.ts`) injeta `?tenant=<slug>` automaticamente em toda chamada pública. Hooks não precisam adicionar manualmente.
- Lógica em `src/pages/Tv.tsx` (componentes `TvPage` wrapper + `TvPageContent` + `TvMissingTenant`).

### `/login` — brand "last login"

`/login` também é pre-auth → não pode resolver tenant via JWT. Adota padrão "last login" das apps modernas:

- `getLastTenant()` (em `src/api/client.ts`) lê `localStorage["pp_last_tenant"]` — slug do último tenant ativo.
- Slug válido → aplica `data-tenant=<slug>` no `<html>` + usa `LOGIN_BRANDS[<slug>]` no painel esquerdo (gradient, inicial, accent color).
- Sem last login (primeira visita, localStorage limpo, slug desconhecido) → fallback `DEFAULT_TENANT_SLUG = "bdn"` (definido em `src/config/tenants.ts`). BDN é a org admin da plataforma, então é o default natural.
- Persistência: `setLastTenant(slug)` é chamado em (a) `Login.handleSubmit` no sucesso do `/auth/login`, (b) `useSwitchTenant.onSuccess`, e (c) `useCurrentUser` sempre que `tenant.slug` chega de `/auth/me`. **Não é limpo no logout** (`clearAuthToken` não toca a chave) — propósito é exatamente sobreviver entre sessões.

Pra adicionar tenant novo no /login: criar entry em `LOGIN_BRANDS` (em `src/pages/Login.tsx`) com `gradientFrom/gradientTo/accentBg/accentText/accentHighlight/accentBlob/initial`. Sem essa entry, cai no fallback BDN.

**Adicionar tenant novo** (3 passos):

1. Criar bloco `[data-tenant="<slug>"] { --background: ...; ... }` em `src/index.css` (copiar do bloco BDN como template).
2. Adicionar entry em `TENANT_FALLBACKS` (`src/config/tenants.ts`) e atualizar tipo `TenantSlug`.
3. Criar tenant via UI `/admin/tenants` (ou script direto no backend).

`TenantSwitcher` (`src/components/shared/TenantSwitcher.tsx`) só aparece se `memberships.length > 1`. Renderiza dropdown na sidebar com indicador `isAdminOrg`.

## Roteamento

- `react-router-dom` v6 com `BrowserRouter`.
- Todas as pages `lazy()` em `App.tsx`.
- **Pública**: `/login`, `/tv` (kiosk, sem auth).
- **Auth obrigatório**: `/`, `/por-dia`, `/ranking`, `/kpis`, `/squad-bet`, `/torneio`, `/assessores`, `/relatorio`, `/relatorio/assessor/:id`, `/presentation`.
- **Admin** (auth + role ADMIN): `/admin/{goals,scoring,penalties,sounds,schedule,biweekly,bets-config,tournaments,announcements,users,tenants}`. Index admin redireciona pra `/admin/goals`.
- `RequireAuth` (inline em `App.tsx:44-50`) checa só o token. `RequireAdmin` (`src/components/layouts/RequireAdmin.tsx`) checa role via `useCurrentUser` e mostra loader enquanto `isLoading` (evita flash).

## Gotchas conhecidos

- **Porta dev é 8080**, não 3000. Está em `vite.config.ts:8`.
- `index.html:2` fixa `<html data-tenant="eqi">` no boot — o `TenantProvider` sobrescreve depois que `/auth/me` resolve. Não confunda; o atributo no HTML é só fallback inicial pra evitar FOUC.
- Comentário "INATIVA em runtime" no bloco `[data-tenant="bdn"]` de `src/index.css:186-190` está **obsoleto** desde 2026-05-10 (multi-tenant ativo). Atualizar quando passar perto.
- `:root` (`src/index.css:106`) **é** a paleta EQI default — não tem bloco `[data-tenant="eqi"]` separado; EQI é o fallback CSS. Se quiser tema EQI explícito, copiar `:root` pra `[data-tenant="eqi"]`.
- **FormData uploads** não usam `apiFetch` (que força Content-Type JSON). Pattern: `fetch` cru + `Authorization` manual. Mantenha consistência (ex: `useKpis.ts:96-118`, `useTenants.ts:69-95`).
- **Dois toasters convivem**: Sonner (novo, em `src/components/ui/sonner.tsx`) + Radix Toaster (legado, em `src/components/ui/toaster.tsx` + `useToast`). Sempre Sonner em código novo.
- **`toLegacyAssessor`** em `src/hooks/useAssessors.ts:57-86` adapta `ApiAssessor` (backend, com `level` + `legacyLevel`) → `Assessor` (legacy em `src/types/assessor.ts`, com `level: "bronze" | "silver" | "gold"` lowercase). Componentes novos (`LevelBadge`, perfil) leem `ApiAssessor.level` real; componentes antigos usam `Assessor.level`. Não confundir os dois shapes.
- **`useRankingStream` invalida 6 query keys** em cascata quando recebe `ranking:update` (lista em `src/hooks/useRankingStream.ts:54-61`). Se adicionar nova entidade que muda quando métrica é registrada, editar essa lista — senão a TV/dashboard ficam até 30s desatualizados.
- **vendor chunks** em `vite.config.ts:24-37`: `vendor-react`, `vendor-charts`, `vendor-motion`, `vendor-markdown`, `vendor-query`, `vendor-dates`. Adicionar dep pesada nova → considerar adicionar chunk. `chunkSizeWarningLimit: 600`.
- **`dedupe`** em `vite.config.ts:18` inclui `react`, `react-dom`, `react/jsx-*`, `@tanstack/react-query`, `@tanstack/query-core` — pra evitar bug de "duas instâncias" que aparece em npm link/workspaces.
- `staleTime: Infinity` em `useCurrentUser` (`src/hooks/useCurrentUser.ts:43`) — não refaz `/auth/me` sozinho. `useSwitchTenant` atualiza via `qc.setQueryData(QUERY_KEY, ...)` manualmente pra refletir o novo tenant sem refetch.
- **HMR overlay desligado** (`vite.config.ts:9-11`) — erros aparecem só no terminal/console do browser, sem modal vermelho.
- **Print CSS** em `src/index.css:10-100` esconde `nav/header/button/.fixed/.sticky` e força preto/branco — `/relatorio*` e `PresentationMode` (slides PDF-friendly) dependem disso. Cuidado ao adicionar elementos novos: marque como `.no-print` se for chrome, ou `.print-show` se for exclusivo de impressão.
- **EventSource fecha em refresh** — não é "vazamento"; `useRankingStream` retorna cleanup que fecha. Reconnect é automático em perda de conexão.

## Deploy

- **Oficial (automatizado)**: push em `main` → `.github/workflows/deploy.yml` builda imagem Docker multi-stage (node:22-alpine → nginx:1.27-alpine) com `VITE_API_URL` como build-arg, tag `:latest` no GHCR, dispara webhook Coolify (`COOLIFY_WEBHOOK_URL` + `COOLIFY_API_KEY` nos secrets do repo). nginx.conf cuida do SPA fallback.
- **Vercel** (`vercel.json`) está configurado (preset Vite, output `dist`, SPA rewrite `/(.*) → /index.html`) mas NÃO é o que o workflow oficial usa — fica como opção manual caso queira subir preview no Vercel.
- Os dois caminhos compartilham `npm run build` — só muda quem serve.

## Forms (react-hook-form + Zod)

Pattern em telas de admin (`AdminGoals`, `AdminScoring`, ...):

```ts
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  pointsPerBucket: z.coerce.number().int().positive(),
});
type FormValues = z.infer<typeof schema>;

const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { name: "", pointsPerBucket: 10 },
});
```

- Usar `<Form>`/`<FormField>` de `src/components/ui/form.tsx` pra integração com shadcn.
- Coerções (`z.coerce.number()`) são úteis em inputs `type="number"` que retornam string.
- Sem libs de form state externas (formik, etc.) — só RHF.

## Datas e timezone

- **`date-fns` v3** é a única lib de data. Não usar moment, dayjs.
- Helpers de range em `src/pages/Index.tsx:45-66` (`rangeForPeriod`) e em `src/lib/biweekly.ts` (períodos quinzenais).
- `startOfWeek(now, { weekStartsOn: 1 })` — segunda como início (padrão do backend).
- Formato de data trocado com backend: **sempre `YYYY-MM-DD`** (string), nunca `Date` cru nem ISO completo. Helper `format(d, "yyyy-MM-dd")`.
- O backend faz toda a conversão pra Brasília (date-fns-tz no backend); frontend trabalha em local time. **Não introduzir `date-fns-tz` aqui** — não precisamos.

## Testes

- **Vitest** com `environment: "jsdom"` (`vitest.config.ts`).
- `globals: true` — `describe/it/expect` disponíveis sem import.
- Setup em `src/test/setup.ts` importa `@testing-library/jest-dom`.
- Padrão `*.test.ts` ou `*.spec.ts` em qualquer lugar de `src/`.
- Coverage não está configurado — adicionar `--coverage` quando necessário.
- Playwright instalado mas sem suite ativa.

Quickstart de um teste de componente:

```ts
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { KpiTile } from "@/components/shared";

describe("KpiTile", () => {
  it("renderiza label e valor", () => {
    render(<KpiTile label="Leads" value={42} unit="" />);
    expect(screen.getByText("Leads")).toBeInTheDocument();
  });
});
```

## Debugging

- **Console SSE**: `useRankingStream` loga `[SSE] Connected to ranking stream` no `connected` event e `[SSE] Connection lost, will auto-reconnect` no `onerror`. Filtre por `[SSE]` pra acompanhar.
- **React Query DevTools**: não estão instalados. Se quiser, `@tanstack/react-query-devtools` + `<ReactQueryDevtools />` antes do `</QueryClientProvider>` em `App.tsx`.
- **Network**: como o backend usa Swagger plugin, `http://localhost:3001/docs` mostra UI de OpenAPI — útil pra testar endpoints sem o frontend.
- **Tenant errado**: se tudo aparecer com paleta EQI mesmo no BDN, conferir `<html data-tenant>` no DevTools (o `TenantProvider` aplica em runtime). Se for `eqi` no DOM e o user é BDN, é bug no `useCurrentUser` ou no JWT.
- **401 loop**: se acaba indo pra `/login` toda hora, token foi inválido — checar `localStorage.pp_token` no DevTools, decodificar em jwt.io pra ver claims e `exp`.
- **HMR overlay desligado** — confira o console do navegador pra erros que não aparecem como modal.

## O que ler primeiro pra entender uma feature

1. **`src/hooks/use<Entity>.ts`** — shape, queries, mutations, regras de invalidação.
2. **`src/api/types.generated.ts`** — confirma o shape exato que vem do backend (procurar por path do endpoint).
3. **`src/pages/<Page>.tsx`** ou **`src/components/dashboard/<Widget>.tsx`** — UI que consome.
4. Backend: **`prisma/schema.prisma`** + **`routes/<entity>.ts`** + **`services/<engine>.ts`** — fonte da verdade do domínio (ver `../CLAUDE.md`).

## Quando adicionar coisa nova

- **Nova entidade do backend** → criar `src/hooks/use<Entity>.ts` (espelhar pattern de `useTenants.ts`), rodar `npm run sync-types`.
- **Nova rota** → adicionar `lazy()` import em `App.tsx`, `<Route>` na árvore, sidebar entry em `DashboardSidebar` se precisar.
- **Nova rota admin** → mesmo + entrar no nested `/admin` route + adicionar ao `AdminSubnav`.
- **Novo widget do dashboard** → `src/components/dashboard/<Widget>.tsx`, importar onde fizer sentido (Index, PorDia, Ranking, ...). Reutilizar `KpiTile`/`SectionCard`/`StatDelta` de `shared/`.
- **Nova entidade tempo-real** (muda quando métrica é registrada) → adicionar `qc.invalidateQueries({ queryKey: ["<entity>"] })` em `useRankingStream` cascade.
- **Novo tenant** → 3 passos descritos em "Multi-tenant em runtime".
- **Novo upload** → seguir pattern FormData de `useKpis.useUploadKpiSound`.
