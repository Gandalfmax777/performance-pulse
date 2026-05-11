# Product

## Register

product

## Users

**Primário: Felipe (sócio gestor).** Decisor que configura todo o sistema (KPIs, pesos, scoring rules, bônus, sons, agenda, torneios, tenants) via `/admin` e consome `Dashboard`, `Por-Dia`, `Ranking` e `Relatorio` no dia-a-dia. Se o produto não for excelente pra ele, morre. As 12 telas `/admin/*` são onde ele mora; o ritual matinal é abrir o Dashboard e ler a semana.

**Secundário: Gerentes da mesa.** Acompanham KPIs diários, ranking individual e por squad, abrem o `Relatorio` semanal/quinzenal com o Felipe. Não configuram, operam. Mesma UI do Felipe, sem o role ADMIN.

**Audiência (não-usuários): Assessores (AAIs).** Não logam, são entidades gerenciadas pelo backend. Vivem o produto através do `Modo-TV` pendurado na mesa (50", kiosk público sem auth) e do `Modo-Apresentacao` que o Felipe puxa em reuniões 1:1. A TV é o que move comportamento; o ranking visível é o motor da gamificação.

**Contexto de uso:**
- Felipe: desktop, sessões longas, várias telas /admin por semana.
- Gerentes: desktop + mobile pontual.
- Assessores: TV de 50" em horário comercial + apresentações projetadas. Nunca touchscreen, nunca login.

## Product Purpose

Performance Pulse é o **sistema operacional de uma mesa de vendas de assessores de investimentos** (AAIs). Métricas diárias (ligações, reuniões agendadas, captação, NPS, etc.) viram pontos via regras configuráveis, pontos viram ranking, ranking alimenta bets, torneios, cofre e prêmios.

A premissa de fundo: **o que é medido em público melhora**. O produto existe pra trocar o "WhatsApp + planilha do gerente" pelo único ritual visível, justo e ao vivo que a mesa toda enxerga.

**Multi-tenant em runtime desde 2026-05-10:** mesma instância serve EQI (verde corporativo), BDN (azul cyan) e futuros tenants. Brand muda via `data-tenant` + CSS variables; a arquitetura de informação é única.

**Sucesso parece com:**
- Felipe lança KPIs em 5 minutos por dia sem abrir planilha.
- Assessores olham a TV de manhã pra saber a posição antes do café.
- Gerentes fecham relatório semanal sem export pra Excel.
- Quando um tenant novo entra, leva horas (não semanas) pra estar com a paleta e o logo dele rodando.

## Brand Personality

**Premium · Ritualístico · Obstinado.**

- **Premium**: trading-desk financeiro, não SaaS de gamificação genérica. Tipografia que respira, número como herói, espaço negativo intencional. Ninguém deve achar que isso é um plugin do Shopify pintado de verde.
- **Ritualístico**: o produto tem hora certa pra acontecer. Bloco de ligações 09:00-11:00, TV no almoço, fechamento de semana sexta. A UI honra esses momentos como cerimônia, não como notificação push.
- **Obstinado**: não esconde nada. Quem está bem aparece com clareza, quem está atrás vê a distância. Mas sem humilhar; competição é leitura de placar, não pelourinho.

Tom de voz: PT-BR, direto, sem corporatês. "Olá, Felipe." na topbar, não "Bem-vindo de volta ao seu painel de controle". Eyebrows monospace ("VISÃO GERAL · SEMANA") dão o ar editorial. Mensagens de erro em PT-BR claras, sem stack trace exposto.

## Anti-references

**Anti-referência mestra (do briefing do Felipe pro Modo TV, 08-mai-2026):** "Editorial financeiro, não placar de UFC. Bloomberg, não estádio."

Vale pro produto inteiro, **com uma exceção controlada**: momentos genuinamente celebratórios da gamificação (meta batida, torneio fechado, streak quebrando recorde) podem ter calor extra via som e motion, sem nunca recair na gramática visual abaixo.

**Nunca:**
- Sites de aposta / bet / cassino. Cards arredondados gritantes, gradientes dourados, podiums 3D, neon, contadores giratórios, "WINNER!" estampado.
- Placar de UFC / placar de estádio. Pontuação em fonte estádium-sport, badges hexagonais, sombras 3D, fotos cropadas em diagonal.
- Hero-metric template SaaS. Card gigante com número, label pequena, três sub-stats em linha, ícone genérico no canto.
- Painel de admin tipo Excel. Tabelas densas sem hierarquia, dropdowns brutalistas, formulários alinhados ao infinito.
- Microinterações de jogo casual mobile. Confetti, bounce elastic, ícones gradientes coloridos por categoria, mascote.
- Glassmorphism decorativo. Blur só quando há profundidade real a comunicar (cabeçalho fixo sobre conteúdo que rola).

**Referências de calibragem positiva** (não pra copiar, pra ter o tom certo quando bater dúvida):
- **Editorial financeiro** (The Economist, FT, NYT): hierarquia tipográfica forte, eyebrows monospace, espaço negativo, autoridade calma.
- **Trading-desk** (Bloomberg Terminal, Robinhood Pro): monospace tabular pra números, densidade quando faz sentido, leitura instantânea de delta.
- **Product polish** (Linear, Vercel, Stripe): precisão de espaçamento, microanimações discretas, neutros tintados, comando ágil.

## Design Principles

1. **Editorial financeiro, nunca placar de UFC.** Cada decisão visual passa pelo filtro: isso é Bloomberg ou isso é casa de apostas? Sempre Bloomberg. Cards retos, números monoespaçados, eyebrows JetBrains Mono, paleta sóbria do tenant. A linguagem visual do Pulse é jornal de pregão, não broadcast esportivo.

2. **Competição visível, dignidade preservada.** O ranking é o motor do produto: ninguém esconde a posição. Mas mostrar não é humilhar. Quem está em 1º brilha sem ofuscar; quem está em 14º vê o caminho de volta, não o tapete vermelho do último. Cor e motion celebram quem subiu, não diminuem quem caiu. Streak vivo, não rótulo de fracasso.

3. **Configurável sem virar planilha.** Todo número, regra, peso, som e horário muda pelo `/admin`, sem deploy. Mas o `/admin` não é um painel de admin genérico: é o mesmo produto editorial, com formulários respirados, defaults inteligentes e validação que ensina. Felipe configura um KPI novo com a mesma sensação de quem escreve numa moleskine, não num CRUD do anos 2010.

4. **Ritual diário acima de feature-set.** O Pulse vive ou morre pelo hábito: lançar KPIs cedo, abrir a TV no início do bloco, ler o ranking no almoço, fechar a semana sexta. Cada tela otimiza pra esse ritual concreto. Feature que não cabe num momento real do dia sai do escopo, mesmo que pareça útil no papel.

5. **Números antes de decoração.** O número é o herói absoluto da interface. Tipografia display gigante (Archivo 800, monospace tabular pra deltas), espaço negativo generoso ao redor, hierarquia óbvia. Cor, ícone e motion existem só pra amplificar leitura do número, nunca pra competir com ele. Se decorou a tela sem servir um número, está errado.

## Accessibility & Inclusion

**Sem auditoria formal de WCAG.** Uso interno em mesa pequena, sem mandato regulatório.

**Cuidados práticos não-negociáveis** (consequência direta dos princípios, não de um padrão):

- **Daltonismo.** Gold/silver/bronze e deltas (▲ / ▼) sempre acompanhados de sinal direcional ou rótulo numérico; nunca cor sozinha carregando significado. Verde EQI e azul BDN convivem com sinais textuais redundantes em métricas críticas.
- **TV 50" a 5 metros.** Tamanhos mínimos pensados pra leitura distante: KPIs principais em 120-156px, ranking em ≥18px, sem texto crítico em <14px. Contraste alto no modo TV mesmo em ambiente iluminado.
- **Mobile dos assessores nunca.** AAIs não logam; mobile é só TV em vertical eventual. Não otimizar admin pra mobile; otimizar TV pra qualquer aspect-ratio.
- **Prefers-reduced-motion.** Marquee do TV, anim de subida no ranking e celebrações de meta respeitam o opt-out do sistema. Motion é tempero, não estrutural; reduzir nunca quebra leitura.
- **PT-BR sempre na UI.** Inglês só em código (variáveis, types, funções). Datas em Brasília, formato `DD/MM/AAAA` na UI, `YYYY-MM-DD` na fronteira HTTP.
