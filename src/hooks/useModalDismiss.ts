import { useEffect } from "react";

/**
 * Hook pra padronizar dismiss de modais custom (não-shadcn).
 *
 * Registra ESC no document. Retorna handler pra usar no backdrop —
 * fecha se o clique foi no próprio backdrop (não bubble-up do conteúdo).
 *
 * shadcn Dialog/Drawer/Sheet/AlertDialog já fazem isso nativamente via
 * Radix; este hook é só pros modais custom do projeto (AssessorProfile,
 * AssessorManager, WeeklyHeatmap detail, etc).
 */
export function useModalDismiss(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return { onBackdropClick };
}
