import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-empty": ["error", { "allowEmptyCatch": true }],
      // Redesign: somente Phosphor. Lista explícita abaixo (override) marca
      // arquivos ainda pendentes de migração — funciona como tracker visível.
      // Cada PR de tela remove arquivos da lista. Quando vazia, esta regra +
      // override saem juntos com `npm uninstall lucide-react` (redesign-cleanup).
      "no-restricted-imports": ["error", {
        paths: [{
          name: "lucide-react",
          message: "Use Phosphor (@phosphor-icons/react). Veja docs/icon-mapping.md.",
        }],
      }],
    },
  },
  {
    // Allowlist temporária — arquivos ainda usando lucide-react.
    // ⚠ Não adicione arquivos novos a esta lista. Cada PR do redesign deve
    //    REMOVER linhas, nunca adicionar.
    files: [
      "src/components/ErrorBoundary.tsx",
      "src/components/layouts/RequireAdmin.tsx",
      "src/components/dashboard/ActivationHighlight.tsx",
      "src/components/dashboard/DirectionComplianceTable.tsx",
      "src/components/dashboard/DirectionEditModal.tsx",
      "src/components/dashboard/InsightHistoryPanel.tsx",
      "src/components/dashboard/PomodoroTimer.tsx",
      "src/components/dashboard/PresentationMode.tsx",
      "src/components/dashboard/RegistrationPanel.tsx",
      "src/components/dashboard/TournamentFinishedOverlay.tsx",
      "src/components/dashboard/WeeklyHeatmap.tsx",
      "src/components/ui/DateRangePicker.tsx",
      "src/components/ui/FullScreenLoader.tsx",
      "src/components/ui/accordion.tsx",
      "src/components/ui/breadcrumb.tsx",
      "src/components/ui/calendar.tsx",
      "src/components/ui/carousel.tsx",
      "src/components/ui/checkbox.tsx",
      "src/components/ui/command.tsx",
      "src/components/ui/context-menu.tsx",
      "src/components/ui/dialog.tsx",
      "src/components/ui/dropdown-menu.tsx",
      "src/components/ui/input-otp.tsx",
      "src/components/ui/menubar.tsx",
      "src/components/ui/navigation-menu.tsx",
      "src/components/ui/pagination.tsx",
      "src/components/ui/radio-group.tsx",
      "src/components/ui/resizable.tsx",
      "src/components/ui/select.tsx",
      "src/components/ui/sheet.tsx",
      "src/components/ui/sidebar.tsx",
      "src/components/ui/toast.tsx",
      "src/pages/admin/AdminSounds.tsx",
      "src/pages/admin/AdminUsers.tsx",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["*.config.{js,ts}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
