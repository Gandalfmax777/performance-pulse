# Performance Pulse — Frontendd

Dashboard de performance de vendas para TV do escritório. Tempo real,
rankings, conquistas, Squad Bet e Modo TV provocativo.

Este repositório é o **frontend** (React + Vite + TS + Tailwind + shadcn/ui),
criado originalmente no [Lovable](https://lovable.dev) e hospedado na Vercel.

O **backend** (Fastify + Prisma + Postgres) fica em repositório separado:
`performance-pulse-backend`, hospedado na VPS via Coolify.

## Rodar localmente

```bash
npm install
npm run dev    # http://localhost:8080
```

Por padrão o frontend aponta pra `http://localhost:3001/api`
(veja `.env.development`). Pra isso funcionar, suba o backend primeiro:

```bash
cd ../performance-pulse-backend
docker compose up -d postgres
npm run dev
```

## Sincronizar tipos com o backend

Os tipos TypeScript do cliente são **gerados automaticamente** a partir do
OpenAPI do backend (`@fastify/swagger` → `openapi-typescript`). A fonte de
verdade dos contratos está nos schemas Zod do backend.

Sempre que o backend mudar schemas, rode:

```bash
# Com o backend rodando em localhost:3001
npm run sync-types
```

O arquivo gerado é `src/api/types.generated.ts` e **é committado** no repo —
assim o build da Vercel não depende do backend estar no ar durante o build.

## Deploy — Vercel

- Framework preset: Vite
- Build command: `npm run build`
- Output: `dist`
- Env var: `VITE_API_URL=https://api.seu-dominio.com/api`

## Lovable

Este projeto continua compatível com o Lovable. O Felipe pode editar via
Lovable e as mudanças sincronizam com este repositório normalmente.
