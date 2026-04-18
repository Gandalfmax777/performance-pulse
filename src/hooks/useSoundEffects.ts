import { useCallback, useEffect, useState } from "react";
import { isMuted, setMuted } from "@/lib/sounds";

/**
 * Hook pra ler/setar mute global. Persiste em localStorage via sounds.ts.
 *
 * Use no header pra mostrar Volume2/VolumeX e toggle.
 */
export function useSoundMuted(): [boolean, (v: boolean) => void] {
  const [muted, setMutedState] = useState<boolean>(() => isMuted());

  // Sincroniza estado entre componentes via storage event
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "pp_sound_muted") {
        setMutedState(e.newValue === "1");
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const update = useCallback((v: boolean) => {
    setMuted(v);
    setMutedState(v);
  }, []);

  return [muted, update];
}
