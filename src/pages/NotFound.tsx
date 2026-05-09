import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-12">
      <div className="text-center max-w-[560px]">
        <p className="num text-[11px] uppercase tracking-[0.22em] text-primary mb-4">
          Erro 404 · página não encontrada
        </p>
        <p
          className="num font-display font-extrabold text-primary leading-none mb-2"
          style={{ fontSize: 140, letterSpacing: "-0.06em" }}
        >
          404
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight leading-tight mb-3 text-ink">
          Esta tela não existe.
        </h1>
        <p className="text-[15px] leading-relaxed text-ink-3 mb-8">
          O link que você seguiu pode estar quebrado ou a tela foi renomeada.
          Volte ao dashboard.
        </p>
        <div className="flex gap-2 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
          >
            <ArrowLeft size={14} weight="bold" />
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
