import { useEffect, useState } from "react";
import { Pencil, Save, X, Check } from "lucide-react";
import { useDailyDirection, useUpsertDailyDirection } from "@/hooks/useDailyDirection";

interface DailyDirectionProps {
  /** Data alvo (YYYY-MM-DD). */
  date: string;
  /** Label do dia já formatado pra exibição (ex: "Quarta 17/04"). */
  dayLabel: string;
}

/**
 * Banner editável de direcionamento diário. Mostra orientação livre do
 * coordenador pra equipe ("foco hoje: cadência de novos, ativos X e Y").
 *
 * - Vazio: mostra placeholder e botão "Adicionar direcionamento".
 * - Com texto: mostra texto + autor + botão de editar.
 * - Editando: textarea + Salvar/Cancelar (auto-save no blur também).
 */
const DailyDirection = ({ date, dayLabel }: DailyDirectionProps) => {
  const { data: direction, isLoading } = useDailyDirection(date);
  const upsert = useUpsertDailyDirection(date);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");

  // Sincroniza texto local quando o backend retorna ou troca de dia
  useEffect(() => {
    setText(direction?.text ?? "");
    setEditing(false);
  }, [direction, date]);

  const handleSave = async () => {
    await upsert.mutateAsync(text);
    setEditing(false);
  };

  const handleCancel = () => {
    setText(direction?.text ?? "");
    setEditing(false);
  };

  if (isLoading) {
    return (
      <div className="card-glass rounded-xl px-4 py-3 border border-border/20 animate-pulse">
        <div className="h-4 w-48 bg-muted/30 rounded" />
      </div>
    );
  }

  if (editing) {
    return (
      <div className="card-glass rounded-xl px-4 py-3 border border-primary/40 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-primary">📌 Direcionamento — {dayLabel}</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          rows={2}
          maxLength={2000}
          placeholder="Foco do dia: cadência de novos, ativos X e Y, prioridade pra reuniões..."
          className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={upsert.isPending}
            className="flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
          >
            {upsert.isPending ? <Check className="w-3 h-3 animate-pulse" /> : <Save className="w-3 h-3" />}
            Salvar
          </button>
          <button
            onClick={handleCancel}
            disabled={upsert.isPending}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
            Cancelar
          </button>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {text.length} / 2000
          </span>
        </div>
      </div>
    );
  }

  // Sem texto registrado
  if (!direction) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full card-glass rounded-xl px-4 py-3 border border-dashed border-border/30 text-left hover:border-primary/40 transition-all group"
      >
        <span className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground transition-all">
          <Pencil className="w-3.5 h-3.5" />
          📌 Adicionar direcionamento — {dayLabel}
        </span>
      </button>
    );
  }

  // Tem texto: visualização
  return (
    <div className="card-glass rounded-xl px-4 py-3 border border-primary/20">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-primary">📌 Direcionamento — {dayLabel}</span>
            <span className="text-[10px] text-muted-foreground">
              por {direction.createdByName}
            </span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{direction.text}</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
          title="Editar direcionamento"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default DailyDirection;
