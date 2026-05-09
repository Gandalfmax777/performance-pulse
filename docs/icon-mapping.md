# Mapping Lucide → Phosphor

A regra do redesign é **somente Phosphor** (`@phosphor-icons/react`).
A lint rule `no-restricted-imports` em `eslint.config.js` baniu novos imports de
`lucide-react`, com uma allowlist temporária dos arquivos ainda pendentes.

Cada PR de tela do redesign:

1. Substitui imports `lucide-react` pelos equivalentes Phosphor abaixo.
2. **Remove o arquivo da allowlist** em `eslint.config.js`.
3. Quando a allowlist ficar vazia, a PR `redesign-cleanup` remove a regra inteira
   e roda `npm uninstall lucide-react`.

## Convenções

- `import { Foo } from "@phosphor-icons/react"` (não `react/dist/ssr`)
- Tamanho via prop: `<Foo size={16} />` (não via Tailwind class).
- Peso via prop `weight`: `regular` (default), `bold`, `fill`, `duotone`, `thin`, `light`.
  Para ícones com peso "2" do Lucide (ex.: `CheckCircle2`), preferir `weight="bold"`.
- Spinner: `<CircleNotch className="animate-spin" />` substitui `Loader2 className="animate-spin"`.

## Tabela

| Lucide | Phosphor | Notas |
|--------|----------|-------|
| `Activity` | `Activity` | — |
| `AlertTriangle` | `Warning` | — |
| `ArrowDown` | `ArrowDown` | — |
| `ArrowLeft` | `ArrowLeft` | — |
| `ArrowRight` | `ArrowRight` | — |
| `ArrowUp` | `ArrowUp` | — |
| `Award` | `Medal` | — |
| `BarChart3` | `ChartBar` | Para variante 3 barras, considerar `ChartBar weight="bold"` |
| `Bell` | `Bell` | — |
| `Calendar` (alias `CalendarIcon`) | `Calendar` | — |
| `CalendarDays` | `CalendarBlank` | Phosphor não distingue grid de dias; `CalendarBlank` é o mais próximo |
| `CalendarOff` | `CalendarX` | — |
| `Check` | `Check` | — |
| `CheckCircle2` | `CheckCircle` | Use `weight="fill"` ou `weight="bold"` para o "2" do Lucide |
| `ChevronDown` | `CaretDown` | — |
| `ChevronLeft` | `CaretLeft` | — |
| `ChevronRight` | `CaretRight` | — |
| `ChevronUp` | `CaretUp` | — |
| `Circle` | `Circle` | — |
| `Clock` | `Clock` | — |
| `Coffee` | `Coffee` | — |
| `Crown` | `Crown` | — |
| `Dot` | `Circle weight="fill"` | Phosphor não tem `Dot` standalone — usar `Circle` filled small |
| `Filter` | `Funnel` | — |
| `Flame` | `Fire` | Phosphor `Fire` é a forma chama mais usada |
| `GitCompare` | `GitDiff` | — |
| `GripVertical` | `DotsSixVertical` | — |
| `History` | `ClockCounterClockwise` | — |
| `Lightbulb` | `Lightbulb` | — |
| `Loader2` | `CircleNotch` | Aplicar `className="animate-spin"` |
| `Medal` | `Medal` | — |
| `MessageSquare` | `ChatSquare` | — |
| `Minus` | `Minus` | — |
| `MoreHorizontal` | `DotsThree` | — |
| `PanelLeft` | `SidebarSimple` | — |
| `Pause` | `Pause` | — |
| `Pencil` | `Pencil` | — |
| `Play` | `Play` | — |
| `Plus` | `Plus` | — |
| `Printer` | `Printer` | — |
| `RefreshCw` | `ArrowClockwise` | — |
| `RotateCcw` | `ArrowCounterClockwise` | — |
| `Save` | `FloppyDisk` | — |
| `Search` | `MagnifyingGlass` | — |
| `Sparkles` | `Sparkle` | — |
| `Target` | `Target` | — |
| `Trash2` | `Trash` | — |
| `TrendingUp` | `TrendUp` | — |
| `Trophy` | `Trophy` | — |
| `User` | `User` | — |
| `Users` | `Users` | Para grupo de 3+, considerar `UsersThree` |
| `X` (alias `XIcon`) | `X` | — |
| `XCircle` | `XCircle` | — |

## Notas globais

- Em `<svg>`/`stroke` patterns custom (ex.: `shell.js` no design HTML),
  prefira mapear para o nome conceitual e escolher o Phosphor mais próximo.
  Para ícones de navegação do sidebar (overview, daily, results, kpis, squad,
  tournament, tv, presentation, team, admin), o registry `src/components/icons.ts`
  centraliza as escolhas — atualizar lá em vez de espalhar pelos componentes.

## Estado intermediário esperado

`tailwind.config.ts` reduziu `--radius` de 14px → 10px no PR `redesign-foundations-tokens`.
**Telas ainda não migradas terão visual misto** (alguns radii a 10px via tokens,
outros componentes shadcn herdando o novo radius automaticamente). Isso é
estado intermediário esperado durante o redesign — **não é regressão**.
