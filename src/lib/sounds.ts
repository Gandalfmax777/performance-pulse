/**
 * Gamificação sonora — tocar MP3/WAV vindos do backend (KpiSound) + sons
 * sintéticos reservados pra eventos especiais (goal hit, ranking rise).
 *
 * Arquitetura (refatorada 22/04/2026 pra eliminar double-play):
 * - KPIs têm som gerenciado pelo admin (upload via UI → R2 → URL pública)
 * - Backend emite `sound:play` via SSE com `{ kpiKey, soundUrl }` quando
 *   KpiSound.enabled && broadcast && rawValue cresceu
 * - `useRankingStream` recebe o evento e chama `playSoundUrl(url)` aqui
 * - Frontend NÃO toca KPI sounds localmente — tudo via broadcast. Isso
 *   elimina a fonte de double-play (antes: synth local + MP3 hardcoded)
 *
 * Sons síntéticos mantidos:
 * - `playGoalHitSound` — quando cruza 100% da meta; depende de prevPercent
 *   client-side, caro replicar no backend, mantém local
 * - `playRiseSound` — subida no ranking; mesma razão
 *
 * Mute é preferência local (localStorage), respeitada tanto em URLs quanto
 * nos synths.
 */

const STORAGE_KEY = "pp_sound_muted";
const NORMAL_VOLUME = 0.3;
const TV_VOLUME = 0.6;

let ctx: AudioContext | null = null;
let muted = false;

if (typeof window !== "undefined") {
  try {
    muted = window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // localStorage bloqueado — mantém default false
  }
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // ignore
  }
}

/** Verifica se está em TV mode (?tv=1 na URL). Volume aumenta. */
function isTvMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("tv") === "1";
}

function getVolume(): number {
  return isTvMode() ? TV_VOLUME : NORMAL_VOLUME;
}

// ─── Synth helpers (usados só por goalHit/rise) ─────────────────────────────

function tone(
  freq: number,
  durationMs: number,
  volume: number,
  when: number = 0,
  type: OscillatorType = "sine",
): void {
  const c = getContext();
  if (!c) return;

  const start = c.currentTime + when;
  const dur = durationMs / 1000;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

function noiseBurst(durationMs: number, volume: number, when: number = 0): void {
  const c = getContext();
  if (!c) return;

  const start = c.currentTime + when;
  const dur = durationMs / 1000;
  const bufferSize = Math.max(1, Math.floor(c.sampleRate * dur));
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const src = c.createBufferSource();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2000;

  src.buffer = buffer;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start(start);
}

// ─── URL-based player (API principal) ───────────────────────────────────────

/**
 * Cache de HTMLAudioElement por URL. Preload on-demand: primeira vez que
 * uma URL é solicitada, cria e inicia download. Próximas chamadas usam
 * o elemento cacheado (reset `currentTime` e play).
 */
type CachedAudio = HTMLAudioElement | "unavailable";
const audioCache = new Map<string, CachedAudio>();

/**
 * Coordenação cross-tab via localStorage. Se outra aba do mesmo browser
 * tocou o MESMO URL nos últimos 700ms, pula. Evita double-play quando
 * Felipe tem dashboard + /tv no mesmo laptop — ambos recebem SSE, só um
 * toca. (Cenários com dispositivos diferentes não compartilham
 * localStorage, então tocam normal — que é o comportamento desejado.)
 */
function recentlyPlayedInAnotherTab(url: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = `pp_last_play_${url}`;
    const last = parseInt(window.localStorage.getItem(key) ?? "0", 10);
    const now = Date.now();
    if (now - last < 700) return true;
    window.localStorage.setItem(key, String(now));
  } catch {
    // localStorage indisponível — sem coordenação, tudo bem
  }
  return false;
}

/**
 * Toca um arquivo de áudio pela URL. Cache por URL evita re-download,
 * respeita mute, faz dedup cross-tab.
 *
 * API principal usada pelo SSE listener em `useRankingStream.ts`.
 */
export function playSoundUrl(url: string): void {
  if (muted) return;
  if (!url) return;
  if (recentlyPlayedInAnotherTab(url)) return;

  const cached = audioCache.get(url);

  // Cache negativo — URL já falhou carregando
  if (cached === "unavailable") return;

  // Cache hit com elemento — toca se pronto
  if (cached && cached instanceof HTMLAudioElement) {
    try {
      cached.currentTime = 0;
      cached.volume = getVolume();
      void cached.play().catch(() => {});
    } catch {
      // ignore — autoplay block, etc
    }
    return;
  }

  // Primeira vez com esse URL: cria e toca otimista. Se falhar load,
  // marca como "unavailable" pra evitar retry em massa.
  const audio = new Audio(url);
  audio.preload = "auto";
  audio.volume = getVolume();
  audio.addEventListener("error", () => {
    audioCache.set(url, "unavailable");
  });
  audioCache.set(url, audio);
  try {
    void audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

// ─── Eventos especiais (sintéticos, sem broadcast) ──────────────────────────

/**
 * Som de vitória ao bater meta (cruzar 100%). Local no client que registrou,
 * não broadcasta — depende de prevPercent específico da mutation.
 */
export function playGoalHitSound(): void {
  if (muted) return;
  try {
    const v = getVolume() * 1.2;
    tone(523.25, 800, v * 0.7, 0, "triangle"); // C5
    tone(659.25, 800, v * 0.7, 0, "triangle"); // E5
    tone(783.99, 800, v * 0.7, 0, "triangle"); // G5
    tone(1046.5, 1000, v * 0.9, 0.1, "triangle"); // C6
    tone(2093, 600, v * 0.4, 0.2, "sine"); // C7
    noiseBurst(500, v * 0.4, 0.3);
  } catch {
    // ignore
  }
}

/**
 * Som de "subida no ranking" — quando assessor passa um colega.
 * Local, não broadcasta (raro e discreto).
 */
export function playRiseSound(): void {
  if (muted) return;
  try {
    const v = getVolume() * 0.9;
    tone(523.25, 120, v * 0.7, 0, "sine"); // C5
    tone(659.25, 120, v * 0.7, 0.07, "sine"); // E5
    tone(783.99, 200, v * 0.8, 0.14, "sine"); // G5
  } catch {
    // ignore
  }
}
