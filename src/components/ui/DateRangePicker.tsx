import { nowInAppTz } from "@/lib/dates";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "@phosphor-icons/react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DateRangeValue {
  from: string; // YYYY-MM-DD
  to: string;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  className?: string;
}

function toYmd(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function fromYmd(s: string): Date {
  // Parse como local midnight pra evitar shift de timezone na display
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
}

const PRESETS = [
  {
    label: "Hoje",
    compute: () => {
      const now = nowInAppTz();
      return { from: toYmd(now), to: toYmd(now) };
    },
  },
  {
    label: "Esta semana",
    compute: () => {
      const now = nowInAppTz();
      return {
        from: toYmd(startOfWeek(now, { weekStartsOn: 1 })),
        to: toYmd(endOfWeek(now, { weekStartsOn: 1 })),
      };
    },
  },
  {
    label: "Este mês",
    compute: () => {
      const now = nowInAppTz();
      return { from: toYmd(startOfMonth(now)), to: toYmd(endOfMonth(now)) };
    },
  },
  {
    label: "Este semestre",
    compute: () => {
      const now = nowInAppTz();
      const month = now.getMonth(); // 0-11
      const semStart = month < 6
        ? new Date(now.getFullYear(), 0, 1)  // jan
        : new Date(now.getFullYear(), 6, 1); // jul
      const semEnd = month < 6
        ? new Date(now.getFullYear(), 5, 30)  // jun 30
        : new Date(now.getFullYear(), 11, 31); // dec 31
      return { from: toYmd(semStart), to: toYmd(semEnd) };
    },
  },
  {
    label: "Últimos 30d",
    compute: () => {
      const now = nowInAppTz();
      return { from: toYmd(subDays(now, 29)), to: toYmd(now) };
    },
  },
];

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const range: DateRange = {
    from: fromYmd(value.from),
    to: fromYmd(value.to),
  };

  const label =
    value.from === value.to
      ? format(fromYmd(value.from), "dd 'de' MMMM", { locale: ptBR })
      : `${format(fromYmd(value.from), "dd/MM", { locale: ptBR })} → ${format(
          fromYmd(value.to),
          "dd/MM",
          { locale: ptBR },
        )}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start gap-2 font-normal bg-muted/30 border-border/30 text-sm",
            className,
          )}
        >
          <CalendarIcon size={16} />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="border-r border-border/30 p-2 space-y-1 flex flex-col">
            {PRESETS.map((p) => (
              <Button
                key={p.label}
                variant="ghost"
                size="sm"
                className="justify-start text-xs font-normal"
                onClick={() => onChange(p.compute())}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={range}
            onSelect={(r) => {
              if (r?.from && r?.to) {
                onChange({ from: toYmd(r.from), to: toYmd(r.to) });
              }
            }}
            weekStartsOn={1}
            locale={ptBR}
            numberOfMonths={2}
            initialFocus
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
