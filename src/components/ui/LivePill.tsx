/**
 * Pill "AO VIVO" — primitivo Editorial V1 com bolinha vermelha
 * pulsante. Usado em TopBars, headers de cards de timeline e
 * qualquer lugar que precise sinalizar live data.
 */
export const LivePill = () => (
  <span
    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-extrabold tracking-[0.1em]"
    style={{
      background: "oklch(0.55 0.22 25 / 0.1)",
      borderColor: "oklch(0.55 0.22 25 / 0.4)",
      color: "oklch(0.55 0.22 25)",
    }}
  >
    <span
      className="w-1.5 h-1.5 rounded-full animate-pulse"
      style={{ background: "oklch(0.65 0.24 25)" }}
    />
    AO VIVO
  </span>
);
