/**
 * Helpers de data ancorados no fuso da aplicação (`America/Sao_Paulo`, BRT).
 *
 * POR QUÊ: o backend calcula semana/mês em BRT (`src/lib/dates.ts` no backend,
 * via date-fns-tz). O frontend usava `new Date()` cru = relógio LOCAL do
 * browser. Para um gestor fora de Brasília (ou SSR), "qual é a semana" podia
 * divergir do backend → dashboard e TV discordavam do ranking.
 *
 * COMO: `nowInAppTz()` devolve um `Date` cujos getters locais
 * (`getFullYear`, `getDay`, ...) já refletem o wall-clock de Brasília. Assim os
 * cálculos de range que o codebase já faz (`startOfWeek(now, {weekStartsOn:1})`,
 * `format(d, "yyyy-MM-dd")`, etc.) passam a casar com o backend SEM mudar a
 * lógica de range — basta trocar a âncora `new Date()` por `nowInAppTz()`.
 *
 * IMPORTANTE: use SÓ para cálculo de período/range e formatação `yyyy-MM-dd`.
 * NÃO use o retorno para `toISOString()`/timestamp absoluto — o instante UTC
 * fica deslocado pelo offset (é o efeito desejado para wall-clock, errado para
 * timestamp). Para timestamps de display use `new Date()` normal.
 */
import { toZonedTime } from "date-fns-tz";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";

export const APP_TIME_ZONE = "America/Sao_Paulo";

/** "Agora" no wall-clock de Brasília (para alimentar cálculos de range). */
export function nowInAppTz(): Date {
  return toZonedTime(new Date(), APP_TIME_ZONE);
}

/** Hoje em Brasília como string `YYYY-MM-DD` (formato trocado com o backend). */
export function todayStrInAppTz(): string {
  return format(nowInAppTz(), "yyyy-MM-dd");
}

/**
 * Início (segunda) e fim (domingo) da semana ISO que contém `ref`, em BRT.
 * Espelha `weekStart`/`weekEnd` do backend (weekStartsOn=1). Default: semana atual.
 */
export function weekRangeInAppTz(ref: Date = nowInAppTz()): { from: Date; to: Date } {
  return {
    from: startOfWeek(ref, { weekStartsOn: 1 }),
    to: endOfWeek(ref, { weekStartsOn: 1 }),
  };
}

/** Início e fim do mês que contém `ref`, em BRT. Default: mês atual. */
export function monthRangeInAppTz(ref: Date = nowInAppTz()): { from: Date; to: Date } {
  return { from: startOfMonth(ref), to: endOfMonth(ref) };
}
