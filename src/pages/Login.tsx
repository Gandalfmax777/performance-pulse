import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, ApiError, setAuthToken } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pulse,
  ArrowRight,
  Television as Tv,
  CircleNotch,
} from "@phosphor-icons/react";

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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* ─── Left: Branding Panel (editorial hero) ─────────────────────── */}
      <div
        className="hidden lg:flex relative overflow-hidden flex-col justify-between p-14 text-white"
        style={{
          background:
            "linear-gradient(160deg, hsl(var(--ink)) 0%, hsl(var(--eqi-forest)) 100%)",
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            top: 60,
            right: -40,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, hsl(var(--gold) / 0.18) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: -60,
            left: -60,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, hsl(var(--eqi-mint) / 0.25) 0%, transparent 70%)",
          }}
        />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Pulse weight="bold" size={18} className="text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="font-extrabold text-base tracking-tight">Performance Pulse</p>
            <p className="text-[9px] uppercase tracking-[0.16em] text-white/50 font-semibold mt-0.5">
              EQI · Mesa de Vendas
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <p
            className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-4"
            style={{ color: "hsl(var(--gold))" }}
          >
            Em destaque · Esta semana
          </p>
          <h1 className="font-display font-extrabold text-5xl xl:text-6xl tracking-tight leading-[1.05]">
            A mesa toda
            <br />
            <span style={{ color: "hsl(var(--gold))" }}>em ritmo</span> de meta.
          </h1>
          <p className="mt-5 text-base text-white/70 max-w-md leading-relaxed">
            Hoje na mesa: reuniões acontecendo, contas ativando e squads disputando ponto a ponto.
            Faça login para acompanhar o movimento em tempo real.
          </p>
        </div>

        <div className="relative z-10 flex items-end gap-10">
          {[
            { v: "108%", l: "meta agregada" },
            { v: "42", l: "ativações" },
            { v: "18", l: "reuniões hoje" },
          ].map((s) => (
            <div key={s.l}>
              <p className="font-mono tv-gigantic text-4xl text-white">{s.v}</p>
              <p className="text-[9px] uppercase tracking-[0.16em] text-white/40 font-semibold mt-2">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Right: Login Form ────────────────────────────────────────── */}
      <div className="flex items-center justify-center p-8 lg:p-14">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Pulse weight="bold" size={18} className="text-primary-foreground" />
            </div>
            <span className="font-extrabold text-ink text-sm tracking-tight">
              Performance Pulse
            </span>
          </div>

          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3 mb-2">
            Entrar na mesa
          </p>
          <h2 className="font-extrabold text-ink text-3xl tracking-tight leading-tight">
            Bem-vindo de volta
          </h2>
          <p className="text-ink-3 text-[13px] mt-2 mb-8">
            Entre com seu e-mail corporativo para acessar o painel da sua mesa.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-[11px] font-semibold text-ink-2"
              >
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@eqi.com.br"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11 rounded-[8px] border-line bg-surface text-ink"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-[11px] font-semibold text-ink-2"
                >
                  Senha
                </label>
                <a
                  href="#"
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Esqueci
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11 rounded-[8px] border-line bg-surface text-ink"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-[10px] font-bold text-sm bg-ink text-white hover:bg-ink/90 transition-colors gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <CircleNotch size={16} className="animate-spin" weight="bold" />
                  Entrando…
                </>
              ) : (
                <>
                  Entrar no painel
                  <ArrowRight size={14} weight="bold" />
                </>
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-line" />
            <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-ink-3">
              ou
            </span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <button
            type="button"
            onClick={() => navigate("/tv")}
            className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2 text-[13px] font-semibold border border-line bg-surface text-ink hover:bg-surface-2 transition-colors"
          >
            <Tv size={15} />
            Entrar como Modo TV
          </button>

          <p className="text-center text-[11px] text-ink-3 mt-7">
            Problemas para acessar?{" "}
            <a href="#" className="text-primary font-semibold hover:underline">
              Falar com suporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
