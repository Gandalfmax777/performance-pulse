/**
 * Pre-resize de imagem no client antes de upload.
 *
 * Lê o arquivo selecionado pelo admin, redimensiona pra MAX × MAX
 * (preservando aspect ratio) via canvas 2D, exporta como JPEG q85.
 * Reduz fotos de celular (3-10MB) pra ~50-200KB antes de POST,
 * evitando 413 do backend e acelerando o upload.
 *
 * Extraído de AssessorManager.tsx em 2026-05-08 quando SquadLogo passou
 * a precisar do mesmo fluxo.
 */
export function resizeImageToBlob(file: File, maxSide = 512, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas não suportado"));
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao converter imagem"))),
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Arquivo inválido"));
    };
    img.src = url;
  });
}
