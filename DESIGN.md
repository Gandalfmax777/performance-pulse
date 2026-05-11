---
name: Performance Pulse
description: The Quiet Scoreboard — editorial trading-desk for a sales floor, dual-tenant (EQI green, BDN navy + cyan).
colors:
  warm-cream: "#f7f5f0"
  mesa-verde: "#0d5132"
  mesa-verde-soft: "#e6f1eb"
  achievement-amber: "#ecaa3d"
  achievement-amber-deep: "#db801d"
  achievement-amber-soft: "#fbf3df"
  silver: "#b1b1b6"
  bronze: "#bf8333"
  success-green: "#29a36c"
  warning-amber: "#e89a2a"
  destructive-warm-red: "#e64a1f"
  ink: "#25262f"
  ink-2: "#494a55"
  ink-3: "#7a7b86"
  ink-4: "#b0b1b9"
  line: "#e3e0d8"
  line-2: "#d2cfc4"
  surface: "#ffffff"
  surface-2: "#f3f1ea"
  cool-frost: "#f4f7fa"
  midnight-navy: "#000b14"
  midnight-navy-2: "#00264a"
  beacon-cyan: "#0083b1"
  beacon-cyan-bright: "#1bccf6"
  bdn-line: "#d3dde6"
  bdn-ink-2: "#22364a"
  bdn-ink-3: "#5b6f82"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.22em"
    fontFeature: "\"tnum\""
  number:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\", \"zero\""
  tv-gigantic:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "clamp(96px, 12vw, 156px)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.04em"
    fontFeature: "\"tnum\""
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.mesa-verde}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-2}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "20px"
  kpi-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "18px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
    typography: "{typography.body}"
  input-focus:
    backgroundColor: "{colors.surface}"
  eyebrow:
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
  sidebar-nav-item:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  sidebar-nav-item-active:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.mesa-verde}"
---

# Design System: Performance Pulse

## 1. Overview

**Creative North Star: "The Quiet Scoreboard"**

Performance Pulse é o placar de uma mesa de vendas de assessores de investimentos lido com a postura editorial de um jornal financeiro. O ranking é visível, o delta é honesto, a TV de 50" trava o ritmo do dia. Mas nada disso é gritado. A interface é um relatório anual da Bloomberg com adrenalina contida, não broadcast esportivo. Quem está em 1º brilha sem ofuscar; quem está em 14º vê a posição com dignidade, não com luz vermelha. O sistema fala alto através do silêncio: número grande, tipografia que respira, eyebrows monospace, espaço negativo intencional.

A gramática visual é dual-tenant em runtime. **EQI** (Mesa Verde + Warm Cream + Achievement Amber) tem o tom de mesa de pregão na zona sul: warm-cinza, verde corporativo profundo, ouro pra conquistas. **BDN** (Midnight Navy + Beacon Cyan + Cool Frost) é o turno noturno: navy quase-preto, cyan como farol de sinal, frost azulado. Mesma arquitetura, dois climas. A troca acontece via `data-tenant` no `<html>` + CSS custom properties; nenhum componente é redesenhado por tenant, só remapeado.

O sistema rejeita, em PT-BR explícito do briefing do Felipe: "placar de UFC", site de aposta, casino, gradient dourado, podiums 3D, hero-metric SaaS, painel-de-admin tipo Excel, glassmorphism decorativo. Cada pixel é Bloomberg ou está errado.

**Key Characteristics:**
- Editorial trading-desk com momentos celebratórios controlados (só som + motion sutil em conquistas reais).
- Dual-tenant: EQI verde + warm cream + amber; BDN navy + cyan + frost. Mesmo esqueleto, peles diferentes.
- Tipografia tri-fonte com papel definido: **Archivo** display (números grandes, headlines), **Inter** body (texto corrido), **JetBrains Mono** numéricos tabulares e eyebrows.
- Cards retos (radius 10px), shadow sutil de 1-3px, sem blur decorativo. Light mode é default; dark existe só pra TV em ambiente escuro.
- Densidade alta quando faz sentido (tabela de ranking, KPI grid 6-up), espaço respirado quando o número é herói (TV mode, KPI strip principal).
- Motion é tempero (delta-up flash, ranking-row reorder), nunca estrutural.

## 2. Colors

A paleta é um sistema de **dois biomas tenant-scoped** sobre um espinha neutro compartilhado. Gold/silver/bronze e success/destructive são universais; o resto é trocado por tenant via `data-tenant`.

### Primary

- **Mesa Verde** (`#0d5132`, `oklch(38% 0.087 158)`): verde EQI escuro, profundo, sem brilho. Usado no `--primary` da skin EQI: hover de nav ativo, botões principais, focus ring, ícone de marca na sidebar. Carrega autoridade institucional, não vibe de app de saúde.
- **Midnight Navy** (`#000b14`, `oklch(13% 0.025 245)`): preto-azulado da skin BDN. Usado em `--ink` e na primary deep do BDN. Não é preto puro: a chroma vestigial inclina pra trading-floor noturna, não pra UI gótica.
- **Beacon Cyan** (`#0083b1` deep / `#1bccf6` bright, `oklch(60% 0.13 220)` / `oklch(80% 0.13 219)`): accent do BDN. Versão deep no `--accent-foreground`, versão bright em destaques e CTAs de TV. Pensado como farol de sinal (tape, ticker, alerta), não como cor decorativa.

### Secondary

- **Achievement Amber** (`#ecaa3d`, `oklch(78% 0.13 75)`): ouro âmbar pra ranking, conquistas, streak. **Substitui** qualquer gradient dourado de bet. Use sólido, nunca em gradient. Soft (`#fbf3df`) pra backgrounds de badge; deep (`#db801d`) pra contraste sobre cream.
- **Silver Ranking** (`#b1b1b6`): cinza neutro pra 2º lugar e estados secundários de progresso.
- **Bronze Ranking** (`#bf8333`): marrom amarelado pra 3º lugar; nunca confundir com Achievement Amber (que é mais cromático e amarelo-quente).

### Tertiary

- **Success Green** (`#29a36c`): só pra delta-up real, progress bar atingindo meta, confirmação. Mais claro e cromático que Mesa Verde de propósito; success é momento, primary é estrutura.
- **Warning Amber** (`#e89a2a`): meta entre 75-99%, atenção. Vive na zona limítrofe entre Achievement Amber e Destructive.
- **Destructive Warm Red** (`#e64a1f`): warm red intencional (chroma na zona laranja-vermelho), não vermelho-sangue-emergência. Erros, delta-down crítico, exclusão.

### Neutral

- **Warm Cream** (`#f7f5f0`, `oklch(0.97 0.005 95)`): fundo principal da skin EQI. Warm-cinza (chroma inclinada pro amarelo/marrom), não cinza-azul. Diferencia-se imediatamente de SaaS comum.
- **Cool Frost** (`#f4f7fa`, `oklch(0.97 0.008 240)`): fundo principal da skin BDN. Azul-acinzentado frio, contraponto direto ao warm cream.
- **Surface** (`#ffffff`): card e popover. Único branco puro do sistema, e mesmo assim isolado em surface de componente, nunca em background de página.
- **Surface 2** (`#f3f1ea` EQI / `#eaeff5` BDN): toggle wash, sidebar nav item active, areas internas de cards multi-secção.
- **Ink scale** (EQI): `#25262f` → `#494a55` → `#7a7b86` → `#b0b1b9`. Quatro paradas de texto e ícone. Ink principal não é puro preto; tem hint frio pra equilibrar o warm do cream.
- **Ink scale** (BDN): `#000b14` → `#22364a` → `#5b6f82` → `#a5b6c6`. Mesma estrutura, viés azulado.
- **Line / Line-2**: divisores de 1px. `#e3e0d8` (EQI) / `#d3dde6` (BDN) padrão; line-2 (`#d2cfc4` / `#c3d0db`) pra divisores enfatizados em tabelas densas.

### Named Rules

**The Mesa Bloomberg Rule.** Nenhum gradient. Em lugar nenhum, em hipótese alguma, exceto: (1) o fundo do hero da TV pode ter um radial-gradient super-sutil (≤6% opacity) pra dar profundidade sem virar Vegas; (2) progress bars usam fill sólido com transição de opacity, não gradient. Tudo o mais é cor flat.

**The Achievement-Not-Casino Rule.** Achievement Amber é a única cor "quente celebratória" do sistema. Use sólido em badge, ícone de troféu, número de streak. **Nunca** combine com glow, neon, ou em qualquer composição que mais de 2 elementos amber estejam visíveis ao mesmo tempo. Ouro raro vale mais que ouro abundante.

**The Tenant Mirror Rule.** Toda decisão de cor que faz sentido na skin EQI precisa ter um espelho semântico equivalente na skin BDN. Se o admin nav active fica `mesa-verde-soft` no EQI, no BDN fica `cool-frost-cyan-tint`. **Nunca** hardcode hex em componente; sempre `hsl(var(--*))` do tenant ativo.

## 3. Typography

**Display Font:** Archivo (weight 500-900 carregadas; usar 800 default pra display)
**Body Font:** Inter (weight 400-700; ss01, cv11 features ativas)
**Label/Mono Font:** JetBrains Mono (weight 400-600; tabular-nums + zero feature ativos)

**Character:** Archivo é a voz da autoridade — letras quase-geométricas com personalidade contida, do gênero "isso é o que a coisa é". Inter carrega o texto corrido com humanidade neutra. JetBrains Mono dá o ar editorial: eyebrows ("VISÃO GERAL · SEMANA"), números tabulares pra alinhar dígitos em colunas, deltas com seta unicode. O pairing é deliberadamente sóbrio: nenhuma das três fontes grita. Quando se quer alto, aumenta-se o tamanho, não a personalidade do tipo.

### Hierarchy

- **Display** (Archivo 800, 32px, line-height 1.05, letter-spacing -0.03em): headlines de tela (`Olá, Felipe.`), título principal do KPI hero, h1 de relatório.
- **Headline** (Archivo 800, 24px, -0.02em, line-height 1.1): card-head-title, título de seção dentro do dashboard.
- **Title** (Inter 700, 18px, -0.01em): subtítulos de bloco, header de tabela, header de modal.
- **Body** (Inter 400-500, 14px, line-height 1.5): texto corrido, descrições de KPI, subtítulos. Cap 65-75ch quando for texto longo (raríssimo no produto; comum em /admin descriptions).
- **Label / Eyebrow** (JetBrains Mono 500, 10-11px, letter-spacing 0.18-0.22em, UPPERCASE): metadata, breadcrumb mono, label de KPI. **Esse é o assinatura tipográfico do sistema.**
- **Number** (JetBrains Mono 700, 30px, tabular-nums, letter-spacing -0.02em): KPI value, leaderboard score, delta percentage. **Os dígitos alinham em coluna porque tabular-nums; é essa precisão que faz parecer Bloomberg.**
- **TV Gigantic** (JetBrains Mono 700, `clamp(96px, 12vw, 156px)`, line-height 0.9, letter-spacing -0.04em): número principal do `Modo-TV` pra leitura a 5 metros. Único momento onde a tipografia toma a tela inteira.

### Named Rules

**The Tabular-Number Rule.** Todo número que pode mudar (KPI, ranking, score, delta, contagem) usa JetBrains Mono com `font-variant-numeric: tabular-nums`. Sem exceção. Números proporcionais dançam quando o valor muda; tabulares ficam parados. O Pulse é um produto que assiste números mudarem. Eles não podem dançar.

**The Eyebrow-Eyebrow Rule.** Toda tela começa com eyebrow monospace UPPERCASE em ink-3 (`#7a7b86`). É a "data publicada" do jornal: você sabe o contexto antes de ler o título. Sem eyebrow, a tela parece um app genérico. Com eyebrow, é editorial.

**The No-Display-In-Inter Rule.** Inter nunca aparece acima de 18px. Headlines e display são exclusivos do Archivo. Mistura quebra a hierarquia tipográfica e mata a sensação editorial.

## 4. Elevation

O sistema é **flat-com-shadow-sutil**. Não usa elevação tonal Material-style (surface containers em camadas de cinza); usa surface branca + linha de 1px + shadow muito leve. A profundidade vem da hierarquia tipográfica, não de empilhamento visual.

No light mode (default), card-glass sai com `box-shadow: 0 1px 2px rgba(10,15,30,.04), 0 1px 3px rgba(10,15,30,.06)`. É o mínimo absoluto pra separar surface do background sem virar drop-shadow Web 2.0. No dark mode (só pra TV em ambiente escuro), o mesmo card vira `rgba(card 85%) + backdrop-filter: blur(16px)` pra ter sensação de "vidro escuro com luz atrás" — único caso aprovado de glassmorphism no sistema, porque comunica profundidade real (luz da TV atrás dos dados).

### Shadow Vocabulary

- **Card subtle** (`0 1px 2px rgba(10,15,30,.04), 0 1px 3px rgba(10,15,30,.06)`): elevação default de cards e KPI tiles. Tão sutil que parece só borda. É de propósito.
- **Card lifted** (`0 10px 40px rgba(10,15,30,.10)`): popover, dropdown, modal. Usado quando o elemento está flutuando temporariamente sobre o conteúdo.
- **Glow primary** (`0 1px 3px hsl(var(--primary) / 0.12), 0 0 0 1px hsl(var(--primary) / 0.15)`): destaque sutil em badges/cards conquistados (BadgesPanel, DayView). É a única "glow" sobrevivente do refactor; tudo mais foi removido.
- **TV dark glass** (`0 1px 3px rgba(0,0,0,.3)` + backdrop-filter blur 16px): só ativo em `.dark .card-glass`. Único caso de blur autorizado.

### Named Rules

**The Flat-By-Default Rule.** Tudo é flat até prova em contrário. Surface = branco, separação = linha 1px ou shadow ≤3px. Profundidade vem de tipografia e espaço, não de drop-shadow. Quando você pensar "esse card precisa pular", pergunte primeiro: posso aumentar o KPI value 4px ao invés? A resposta quase sempre é sim.

**The No-Decorative-Blur Rule.** Backdrop-filter blur é proibido em light mode. No dark mode, autorizado **apenas** em `.dark .card-glass` porque comunica profundidade real (luz da TV atrás do conteúdo). Qualquer outro uso de blur (glass header, gradient orb, hero overlay) é cliché 2021 e violaria o North Star.

## 5. Components

### Buttons

- **Shape:** retângulo com cantos suavemente arredondados (`10px`, `--radius`). Nunca pill (full-rounded), nunca quadrado puro. Pill seria casino; quadrado seria brutalista.
- **Primary:** `bg = mesa-verde` (EQI) ou `bg = midnight-navy-2` (BDN), `text = surface`, `padding 10-12px × 16px`, label em Inter 500 14px. Hover: bg escurece pro ink puro; nunca opacidade reduzida.
- **Hover / Focus:** transição `background 150ms ease-out`. Focus visible mostra `outline: 2px solid var(--ring)` com offset 2px; sem glow, sem box-shadow.
- **Ghost / Sm:** `bg = surface`, border ou nada, text ink. Usado em ações secundárias na topbar e barra de tabs. `.btn-sm` reduz padding a `6px × 12px` e font-size a 13px.
- **Disabled:** opacity 50%, cursor not-allowed. Nunca trocar cor por cinza diferente; opacity preserva a identidade do botão em estado morto.

### KPI Tile

- **Shape:** card-glass com radius `--radius-sm` (6px), padding 18px. Quando dentro de um grid de KPIs (KPIs grid 6-up no Dashboard), os tiles ficam **separados por 1px de --line** usando a técnica `gap:1px; background: var(--line)` no parent — visualmente parecem células de uma tabela editorial. Não cards individuais com shadow cada.
- **Anatomy:** eyebrow no topo (`MONO 10-11px ink-3`), número grande no meio (`Archivo display num font-size 30px`), delta inline à direita (`mono 12px com seta unicode`), kpi-sub abaixo (`Inter 400 13px ink-3`), progress bar opcional no rodapé (1px height).
- **Variants:** `.kpi-accent` (versão com `--primary` no fundo + texto invertido) usada **uma vez** por tela no KPI principal. Mais que um vira display de cassino.

### Cards / Containers

- **Corner Style:** `--radius` 10px default. Cards de KPI usam 6px. Cards de modal usam 14px.
- **Background:** `surface` (`#ffffff`) light, `card / 0.85` dark.
- **Shadow Strategy:** veja Elevation. Default é card subtle.
- **Border:** `1px solid var(--border)` (`#e3e0d8` EQI / `#d3dde6` BDN). Linha sempre presente; sombra é tempero opcional.
- **Internal Padding:** 20px default no card; 18px em KPI tile; 32px em card hero do TV mode.
- **No Nested Cards.** Card dentro de card é proibido. Se precisa de subsecção visual, use separator (border-bottom 1px line) e eyebrow.

### Tables / Leaderboard

- **Header:** linha de eyebrow monospace (10-11px MONO UPPERCASE ink-3) acima da primeira row de dados, com border-bottom 1px line-2. **Não usa fundo cinza**; o tipo carrega o peso visual.
- **Row:** padding-y 14-16px, border-bottom 1px line. Hover: `bg = surface-2` (warm wash). Linha de ranking 1º recebe Achievement Amber soft (`#fbf3df`) como bg + Achievement Amber deep como text na posição; 2º e 3º apenas cor textual silver/bronze, sem bg.
- **Numbers:** tabular-nums obrigatório. Dígitos alinham mesmo em fontes proporcionais ao redor.
- **No Stripes.** Zebra striping (rows alternados em surface/surface-2) é proibido. Visual de planilha. Usa border-bottom de line-2 entre rows pra dar ritmo se necessário.

### Inputs / Fields

- **Style:** `bg = surface`, `border 1px solid var(--input)`, `padding 10px × 12px`, `radius 10px`, body typography.
- **Focus:** border vira `var(--ring)` (mesa-verde EQI / beacon-cyan BDN), opcional `box-shadow: 0 0 0 3px rgba(var(--ring), 0.15)` muito sutil. Nunca glow saturado.
- **Error:** border `destructive-warm-red`, helper text abaixo em destructive 12px Inter 500.
- **Label:** Inter 500 13px ink-2 acima do input. Não usar floating label pattern; clichê Material que destoa do tom editorial.

### Sidebar Nav

- **Shape:** sticky left, 248px width, fundo `sidebar-background` (white). Border-right 1px line.
- **Brand mark no topo:** 40×40 quadrado com `logoUrl` do tenant (imagem) ou inicial do brand. Eyebrow logo abaixo: `"EQI · MESA"` ou `"BDN · MESA"`.
- **Nav item:** padding 8-10px × 12px, body typography, ícone Phosphor à esquerda. **Default:** text ink-2, bg transparent. **Hover:** bg surface-2. **Active:** bg surface-2 + text primary (mesa-verde / midnight-navy-2) + ícone pintado, sem border-left (PROIBIDO pelo absolute ban "side-stripe borders").
- **Section eyebrow:** divisor entre grupos de itens via eyebrow monospace UPPERCASE ink-3.

### Topbar

- **Layout:** title block à esquerda (eyebrow crumb + h1 display), actions à direita (tabs + period picker + "📺 Modo TV" primary).
- **Eyebrow crumb:** mono UPPERCASE 11px ink-3 com `·` separador (não slash, não chevron).
- **H1:** Archivo 800 display, sem pontuação extra. "Olá, Felipe." é literalmente a copy. Personificação direta.

### Delta / Stat

- **Anatomy:** seta unicode `▲` (up) ou `▼` (down) + valor + unidade. Sempre mono. Sempre com cor: `success-green` up, `destructive-warm-red` down, `ink-3` zero. **Ícone direcional é obrigatório**: cor sozinha violaria o cuidado de daltonismo do PRODUCT.md.

### TV Gigantic Display

- **Layout:** número central em `clamp(96px, 12vw, 156px)` mono 700, label monospace UPPERCASE acima, contexto Inter 400 abaixo. Padding generoso (≥80px) ao redor.
- **Background:** dark mode (background base `#0F141A`), card-glass com blur 16px. Único caso onde o sistema vira escuro.
- **Refresh:** marquee de ticker no rodapé, 60s linear infinite, conteúdo duplicado pra loop sem salto. Respeita `prefers-reduced-motion: reduce` — em modo reduzido, ticker congela com timestamp da última atualização visível.

## 6. Do's and Don'ts

### Do:
- **Do** usar tabular-nums em **todo** número que pode mudar. KPI, ranking, score, delta, percentage. Sem exceção.
- **Do** começar cada tela com eyebrow monospace UPPERCASE em ink-3 (`#7a7b86`). É a assinatura do sistema.
- **Do** ler `--background`, `--primary`, `--ink` via `hsl(var(--*))` sempre. Nunca hardcode hex em componente; o tenant troca a paleta via `data-tenant`.
- **Do** preservar dignidade do último colocado. Cor neutra (ink-3 / silver), sem destaque negativo, sem ícone de derrota. A ausência de Achievement Amber já comunica.
- **Do** usar Achievement Amber sólido em badges e ouros. Soft (`#fbf3df`) pra fundo de linha de 1º; deep (`#db801d`) só pra contraste em texto sobre amber soft.
- **Do** respeitar `prefers-reduced-motion`. Marquee do TV, anim de subida no ranking, celebrações: tudo desativável.
- **Do** manter texto em PT-BR na UI. Inglês fica em código (variáveis, types, props), nunca exposto pro usuário.
- **Do** usar `1px solid var(--line)` como divisor padrão. Cards retos, bordas finas, sombra mínima.
- **Do** dimensionar pra leitura de 5 metros no Modo TV: KPI principal 120-156px, ranking ≥18px, nada crítico abaixo de 14px.

### Don't:
- **Don't** usar gradient dourado em lugar nenhum. **Nunca.** Citado explicitamente no briefing do Felipe: "sem gradientes dourados, sem podiums 3D". Ouro é sólido. Pódio é linha de tabela com bg amber soft.
- **Don't** usar `border-left > 1px` como acento colorido em cards, alerts, list items, callouts. Banido pela impeccable e pelo absolute ban interno; reescrever com border completa, bg tint, ou número/ícone à esquerda.
- **Don't** usar `background-clip: text` com gradient (gradient text). Banido. Solid color com peso ou tamanho diferente faz o destaque.
- **Don't** usar glassmorphism decorativo. Única exceção autorizada: `.dark .card-glass` no Modo TV, porque comunica profundidade real.
- **Don't** estampar "hero metric template" SaaS (número gigante + label + 3 sub-stats em linha + ícone genérico no canto). É exatamente o que o KPI tile do Pulse deliberadamente NÃO é. KPIs são tiles editoriais em grid de 1px, não cards independentes com shadow.
- **Don't** estampar grids de cards idênticos com `ícone + heading + texto` repetidos. Esse é o slop test mais óbvio. Use hierarquia tipográfica e separadores de linha pra agrupar.
- **Don't** usar zebra striping (rows alternados em cor) em tabelas. Visual de planilha do Excel. Border-bottom de line-2 entre rows resolve.
- **Don't** usar pill buttons (border-radius full). Casino. Cantos do sistema são 6/10/14px; pill nunca.
- **Don't** usar mascote, confetti, bounce elastic, ou microinteração de jogo casual. O Pulse celebra com som broadcast e motion sutil (delta-up flash, ranking-row reorder slide), não com partículas.
- **Don't** misturar Inter acima de 18px com Archivo abaixo de 24px. Inter é body; Archivo é display. Quebrar a regra mata o ar editorial.
- **Don't** abrir modal como primeira opção. Inline edits, popovers, drawers e command palette (cmdk) existem por algo. Modal só quando interromper o usuário é o ponto.
- **Don't** confundir Achievement Amber, Warning Amber, e Bronze. Achievement é trofeu (amarelo cromático puro); Warning é zona limítrofe (amarelo-laranja); Bronze é 3º lugar (marrom-amarelado dessaturado). Misturar destrói a leitura instantânea do estado.
- **Don't** desenhar `/admin` como CRUD genérico. Mesma alma editorial do app principal: eyebrows, hierarquia tipográfica, espaço respirado, defaults inteligentes. Formulário do Felipe não pode parecer phpMyAdmin.
