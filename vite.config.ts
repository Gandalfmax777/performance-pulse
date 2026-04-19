import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    // Chunks vendor separados pra (a) cache mais granular entre deploys
    // (mudar Index.tsx não invalida o chunk de recharts) e (b) reduzir o
    // bundle inicial — quem carrega só Login não baixa recharts/framer-motion.
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": ["recharts"],
          "vendor-motion": ["framer-motion"],
          "vendor-markdown": ["react-markdown"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-dates": ["date-fns"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
