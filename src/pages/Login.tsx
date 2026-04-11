import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, ApiError, setAuthToken } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Loader2 } from "lucide-react";

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
        skipAuth: true,
      });
      setAuthToken(res.token);
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("E-mail ou senha inválidos.");
      } else {
        setError("Erro ao fazer login. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Left: Branding Panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-muted/60 dark:bg-card flex-col justify-between p-10">
        {/* Decorative circles */}
        <div className="absolute -top-20 right-[-80px] w-[320px] h-[320px] rounded-full bg-primary/[0.07]" />
        <div className="absolute -bottom-16 -left-16 w-[400px] h-[400px] rounded-full bg-primary/[0.05]" />
        <div className="absolute bottom-20 left-40 w-[200px] h-[200px] rounded-full bg-primary/[0.04]" />

        {/* Logo */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-lg gradient-neon flex items-center justify-center">
            <Activity className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground text-sm tracking-tight">
            Performance Pulse
          </span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-md">
          <h1 className="font-display font-extrabold text-foreground text-4xl xl:text-5xl leading-[1.1] tracking-tight">
            Performance{" "}
            <span className="text-primary">inteligente.</span>
            <br />
            Resultados reais.
          </h1>
          <p className="mt-5 text-muted-foreground text-base leading-relaxed max-w-sm">
            O dashboard feito para times de alta performance. KPIs, ranking e gamificação em um só lugar.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-12 relative z-10">
          <div>
            <p className="font-display font-black text-foreground text-2xl">100%</p>
            <p className="text-xs text-muted-foreground mt-0.5">dados em tempo real</p>
          </div>
          <div>
            <p className="font-display font-black text-foreground text-2xl">3&times;</p>
            <p className="text-xs text-muted-foreground mt-0.5">mais engajamento</p>
          </div>
          <div>
            <p className="font-display font-black text-foreground text-2xl">&infin;</p>
            <p className="text-xs text-muted-foreground mt-0.5">metas acompanhadas</p>
          </div>
        </div>
      </div>

      {/* ─── Right: Login Form ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo (hidden on lg) */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-lg gradient-neon flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground text-sm tracking-tight">
              Performance Pulse
            </span>
          </div>

          <h2 className="font-display font-bold text-foreground text-2xl tracking-tight">
            Bem-vindo de volta
          </h2>
          <p className="text-muted-foreground text-sm mt-1.5 mb-8">
            Entre com sua conta para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-11 font-semibold text-sm gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Acesso exclusivo por convite.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
