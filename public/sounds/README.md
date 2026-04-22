# Sounds customizados

Arquivos de áudio que sobrescrevem os sons sintéticos do `src/lib/sounds.ts`.

## Arquivos esperados

- `ativacao.mp3` — som tocado quando alguém registra uma Ativação de Conta.
  Broadcast via SSE pra tocar em todos clientes conectados (dashboard + TV).
  Se o arquivo não existir ou falhar no load, cai no fallback sintético
  (fanfarra C5-E5-G5-C6).

## Formato recomendado

- `.mp3` (melhor compat cross-browser) ou `.wav`
- Curto: 1-3 segundos idealmente
- Volume normalizado (-3 dBFS ish) — o player aplica o volume contextual
  (TV mode usa volume maior)
