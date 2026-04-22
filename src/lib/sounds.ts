/**
 * Gamificação sonora — sons sintéticos via Web Audio API.
 *
 * Cada KPI tem um som curto associado (200-1000ms). Quando alguém cruza
 * 100% da meta, toca som de vitória extra.
 *
 * Sem dependência de arquivos MP3 — tudo gerado em código com OscillatorNode
 * + GainNode + envelope ADSR.
 *
 * Auto-play policy: AudioContext é lazy-init. Primeiro user gesture na página
 * (qualquer click) destrava. Antes disso, playSound() é no-op silencioso.
 */

const STORAGE_KEY = "pp_sound_muted";
const NORMAL_VOLUME = 0.3;
const TV_VOLUME = 0.6;

let ctx: AudioContext | null = null;
let muted = false;

// Lazy load do estado mute do localStorage
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
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
    } catch {
      return null;
    }
  }
  // Resume se suspenso (autoplay policy)
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

/**
 * Toca um tom sintético com envelope ADSR simples.
 * @param freq Frequência em Hz
 * @param durationMs Duração total do som
 * @param volume Volume final (0-1)
 * @param when Offset em segundos a partir do AudioContext.currentTime (pra orquestrar múltiplos tons)
 * @param type Tipo de oscilador (sine = limpo, triangle = mais cheio, sawtooth = brilhante)
 */
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

  // Envelope: attack curto (10ms) → decay/release pra duração total
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/** Tom com sweep de frequência (woosh, glissando). */
function sweep(
  freqStart: number,
  freqEnd: number,
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
  osc.frequency.setValueAtTime(freqStart, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), start + dur);

  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/** Burst de ruído branco (pra "cha" da caixa registradora, applause). */
function noiseBurst(durationMs: number, volume: number, when: number = 0): void {
  const c = getContext();
  if (!c) return;

  const start = c.currentTime + when;
  const dur = durationMs / 1000;
  const bufferSize = Math.max(1, Math.floor(c.sampleRate * dur));
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // decay linear
  }

  const src = c.createBufferSource();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2000; // só agudos pra soar como "cha"

  src.buffer = buffer;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start(start);
}

// ─── Sons por KPI ──────────────────────────────────────────────────────────

function getVolume(): number {
  return isTvMode() ? TV_VOLUME : NORMAL_VOLUME;
}

const SOUND_BUILDERS: Record<string, () => void> = {
  // Lead = ka-ching (caixa registradora): 2 tons descendentes + brilho + cha
  leads: () => {
    const v = getVolume();
    tone(1320, 80, v * 1.0, 0, "triangle"); // "ka"
    tone(880, 200, v * 0.9, 0.08, "triangle"); // "ching"
    tone(1760, 300, v * 0.4, 0.1, "sine"); // brilho
    noiseBurst(150, v * 0.3, 0.05); // "cha"
  },
  // Ligação = blip curto
  ligacoes: () => {
    tone(660, 80, getVolume(), 0, "sine");
  },
  // Reunião agendada = sino
  reunioes: () => {
    const v = getVolume();
    tone(1200, 600, v * 0.8, 0, "sine");
    tone(2400, 600, v * 0.3, 0, "sine"); // harmonic
  },
  // Reunião realizada = sino duplo (peso alto)
  reunioes_realizadas: () => {
    const v = getVolume();
    tone(1200, 500, v * 0.8, 0, "sine");
    tone(2400, 500, v * 0.3, 0, "sine");
    tone(1200, 500, v * 0.8, 0.15, "sine");
    tone(2400, 500, v * 0.3, 0.15, "sine");
  },
  // Boleta = chime acorde C maior (C5-E5-G5)
  boletos: () => {
    const v = getVolume();
    tone(523.25, 200, v * 0.7, 0, "sine"); // C5
    tone(659.25, 200, v * 0.6, 0.04, "sine"); // E5
    tone(783.99, 250, v * 0.6, 0.08, "sine"); // G5
  },
  // Cadência = woosh ascendente
  cadencia: () => {
    sweep(200, 2000, 350, getVolume() * 0.6, 0, "sawtooth");
  },
  // Touchpoint = pop curto
  touchpoint: () => {
    tone(400, 60, getVolume(), 0, "triangle");
  },
  // Indicação = glitter ascendente
  indicacoes: () => {
    const v = getVolume();
    tone(880, 100, v * 0.6, 0, "sine"); // A5
    tone(1108.73, 100, v * 0.6, 0.06, "sine"); // C#6
    tone(1318.51, 100, v * 0.6, 0.12, "sine"); // E6
    tone(1760, 200, v * 0.7, 0.18, "sine"); // A6
  },
  // Ativação de conta = fanfarra triunfal C5-E5-G5-C6
  // Fallback pro synth se /sounds/ativacao.mp3 não existir. Se o arquivo
  // existir (Felipe envia o som dele pra `public/sounds/ativacao.mp3`),
  // playKpiSound tenta ele primeiro — ver CUSTOM_SOUND_FILES abaixo.
  ativacao_conta: () => {
    const v = getVolume();
    tone(523.25, 150, v * 0.8, 0, "triangle"); // C5
    tone(659.25, 150, v * 0.8, 0.13, "triangle"); // E5
    tone(783.99, 150, v * 0.8, 0.26, "triangle"); // G5
    tone(1046.5, 400, v * 1.0, 0.39, "triangle"); // C6 (mais longa)
    tone(1567.98, 400, v * 0.5, 0.39, "sine"); // G6 harmonic
  },
};

// ─── Custom sound files (override do synth) ────────────────────────────────
//
// Felipe pode colocar arquivos MP3/WAV em `public/sounds/` e o playKpiSound
// vai tocar eles em vez do synth. Se o arquivo 404, faz fallback pro synth.
// Cache de HTMLAudioElement por KPI pra evitar re-download a cada play.
const CUSTOM_SOUND_FILES: Record<string, string> = {
  // Nome com espaços precisa ser URL-encoded pro fetch não dar 404
  ativacao_conta: "/sounds/Cash%20Money%20Sound%20Effect.mp3",
};
const customAudioCache = new Map<string, HTMLAudioElement | null>();

/**
 * Tenta tocar arquivo MP3 custom. Retorna true se conseguiu, false se
 * precisa fallback pro synth (arquivo não existe / erro de load).
 */
function tryPlayCustomFile(kpiKey: string): boolean {
  const path = CUSTOM_SOUND_FILES[kpiKey];
  if (!path) return false;

  // Cache hit com audio já carregado e válido
  const cached = customAudioCache.get(kpiKey);
  if (cached === null) return false; // cache negativo (404 conhecido)
  if (cached && cached.readyState >= 2) {
    try {
      cached.currentTime = 0;
      cached.volume = getVolume();
      void cached.play();
      return true;
    } catch {
      return false;
    }
  }

  // Primeira vez: cria, tenta carregar
  if (!cached) {
    const audio = new Audio(path);
    audio.preload = "auto";
    audio.volume = getVolume();
    audio.addEventListener("error", () => {
      customAudioCache.set(kpiKey, null); // marca como indisponível
    });
    audio.addEventListener("canplaythrough", () => {
      customAudioCache.set(kpiKey, audio);
    });
    customAudioCache.set(kpiKey, audio);
    // Tenta tocar imediatamente (se já estiver cacheado no browser)
    try {
      void audio.play();
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

/** Default fallback — KPI desconhecido toca um chime simples. */
function defaultSound(): void {
  const v = getVolume();
  tone(880, 150, v * 0.6, 0, "sine");
  tone(1320, 150, v * 0.5, 0.05, "sine");
}

/**
 * Toca o som associado ao KPI. Silencioso se mudo ou AudioContext bloqueado.
 * Prioriza arquivo MP3 custom (se registrado em CUSTOM_SOUND_FILES e carregado);
 * fallback pro synth Web Audio.
 */
export function playKpiSound(kpiKey: string): void {
  if (muted) return;
  try {
    if (tryPlayCustomFile(kpiKey)) return;
  } catch {
    // fallback synth
  }
  const builder = SOUND_BUILDERS[kpiKey] ?? defaultSound;
  try {
    builder();
  } catch {
    // ignore
  }
}

/**
 * Som de "subida no ranking" — quando assessor passa um colega na ordem.
 * Mais discreto que goal-hit (não é meta batida, é só uma posição). 3 notas
 * ascendentes rápidas C5-E5-G5 (acorde maior em arpejo).
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

/**
 * Som de vitória ao bater meta (cruzar 100%). Mais cheio que os por-KPI.
 */
export function playGoalHitSound(): void {
  if (muted) return;
  try {
    const v = getVolume() * 1.2;
    // Acorde maior cheio
    tone(523.25, 800, v * 0.7, 0, "triangle"); // C5
    tone(659.25, 800, v * 0.7, 0, "triangle"); // E5
    tone(783.99, 800, v * 0.7, 0, "triangle"); // G5
    tone(1046.5, 1000, v * 0.9, 0.1, "triangle"); // C6
    // Brilho
    tone(2093, 600, v * 0.4, 0.2, "sine"); // C7
    // "Applause" via ruído filtrado
    noiseBurst(500, v * 0.4, 0.3);
  } catch {
    // ignore
  }
}
