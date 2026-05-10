import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, ApiError, setAuthToken } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Television,
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

const KEYWORDS = ["Inteligente", "Obstinada", "Inovadora", "Dinâmica"];

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
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div
        className="w-full max-w-[1080px] grid lg:grid-cols-2 bg-surface border border-line rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 10px 40px hsl(240 12% 16% / 0.08)" }}
      >
        {/* ─── Left: editorial brand panel ─────────────────────────────── */}
        <div
          className="relative hidden lg:flex flex-col justify-between p-14 text-white overflow-hidden min-h-[600px]"
          style={{
            background:
              "linear-gradient(155deg, hsl(var(--eqi-forest)) 0%, hsl(220 27% 5%) 95%)",
          }}
        >
          {/* Atmospheric accent — gold blob */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: -120,
              right: -120,
              width: 380,
              height: 380,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, hsl(var(--eqi-mint) / 0.22) 0%, transparent 65%)",
            }}
          />

          {/* Brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center font-display"
                style={{
                  background: "hsl(var(--eqi-mint))",
                  color: "hsl(var(--eqi-forest))",
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                }}
                aria-hidden
              >
                E
              </div>
              <div className="leading-tight">
                <p className="font-display text-lg font-extrabold tracking-tight leading-none">
                  Performance Pulse
                </p>
                <p className="num text-[9px] uppercase tracking-[0.22em] text-white/55 mt-1">
                  Mesa de Performance
                </p>
              </div>
            </div>

            <p
              className="num text-[10px] uppercase tracking-[0.22em] mb-4"
              style={{ color: "hsl(var(--eqi-mint))" }}
            >
              Mesa de performance · v3.2
            </p>
            <h1 className="font-display text-5xl xl:text-[48px] font-extrabold tracking-[-0.04em] leading-[1.02] m-0">
              A meta não é um número.
              <br />
              É um <span style={{ color: "hsl(var(--eqi-mint))" }}>ritmo.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/65 max-w-[380px]">
              Acompanhe seu time em tempo real — KPIs, ranking, torneios e Squad
              Bet. Bata meta com leitura clara e disciplina diária.
            </p>
          </div>

          {/* Footer: keywords + copyright */}
          <div className="relative z-10">
            <div className="flex flex-wrap gap-2 mb-6">
              {KEYWORDS.map((k) => (
                <span
                  key={k}
                  className="num text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full"
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
            <p className="num text-[11px] uppercase tracking-[0.16em] text-white/40">
              © 2026 Performance Pulse
            </p>
          </div>
        </div>

        {/* ─── Right: login form ──────────────────────────────────────── */}
        <div className="flex items-center p-8 lg:p-14">
          <div className="w-full max-w-sm mx-auto">
            {/* Mobile brand mark */}
            <div className="flex items-center gap-3 mb-10 lg:hidden">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-display"
                style={{
                  background: "hsl(var(--eqi-forest))",
                  color: "hsl(var(--eqi-mint))",
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                }}
                aria-hidden
              >
                E
              </div>
              <span className="font-display text-base font-extrabold tracking-tight text-ink">
                Performance Pulse
              </span>
            </div>

            <p className="eyebrow mb-2">Acesse sua conta</p>
            <h2 className="title-xl mb-1.5">Bem-vindo de volta.</h2>
            <p className="text-sm text-ink-3 m-0 mb-7">
              Entre com seu e-mail corporativo para acessar o dashboard.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold text-ink-2"
                >
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@empresa.com.br"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold text-ink-2"
                  >
                    Senha
                  </label>
                  <a
                    href="#"
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Esqueci a senha
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••"
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
                className="w-full h-11 mt-2 font-semibold gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CircleNotch
                      size={16}
                      className="animate-spin"
                      weight="bold"
                    />
                    Entrando…
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight size={14} weight="bold" />
                  </>
                )}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-line" />
              <span className="num text-[10px] uppercase tracking-[0.18em] font-semibold text-ink-3">
                ou
              </span>
              <div className="flex-1 h-px bg-line" />
            </div>

            <button
              type="button"
              onClick={() => navigate("/tv")}
              className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2 text-sm font-semibold border border-line bg-surface text-ink hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors disabled:opacity-50"
            >
              <Television size={15} weight="bold" />
              Entrar como Modo TV
            </button>

            <p className="mt-7 pt-5 border-t border-line text-xs text-ink-3 leading-relaxed">
              Não tem conta? Fale com o administrador da sua mesa para receber o
              convite.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
