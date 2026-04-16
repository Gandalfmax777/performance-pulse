// Markers usados no campo `notes` pra reuniões que geram pontos automáticos.
// Backend detecta esses prefixos e sobrescreve pointsAwarded.

export const MEETING_NOTE_PREFIX = "[REUNIAO]";
export const MEETING_BONUS_POINTS = 10;

export const MEETING_AREA_PREFIX = "[REUNIAO_AREA]";
export const MEETING_AREA_POINTS = 5;

export const SALESFORCE_PREFIX = "[SALESFORCE_OK]";

export type NoteType = "observation" | "meeting" | "meeting_area";

export function isMeetingNote(notes: string | null | undefined): boolean {
  if (!notes) return false;
  return notes.trimStart().startsWith(MEETING_NOTE_PREFIX) &&
    !notes.trimStart().startsWith(MEETING_AREA_PREFIX);
}

export function isMeetingAreaNote(notes: string | null | undefined): boolean {
  if (!notes) return false;
  return notes.trimStart().startsWith(MEETING_AREA_PREFIX);
}

export function isSalesforceCheck(notes: string | null | undefined): boolean {
  if (!notes) return false;
  return notes.trimStart().startsWith(SALESFORCE_PREFIX);
}

export function stripMeetingPrefix(notes: string): string {
  if (notes.trimStart().startsWith(MEETING_AREA_PREFIX)) {
    return notes.trimStart().slice(MEETING_AREA_PREFIX.length).trim();
  }
  if (notes.trimStart().startsWith(MEETING_NOTE_PREFIX)) {
    return notes.trimStart().slice(MEETING_NOTE_PREFIX.length).trim();
  }
  return notes;
}

export function getNoteType(notes: string | null | undefined): NoteType {
  if (isMeetingNote(notes)) return "meeting";
  if (isMeetingAreaNote(notes)) return "meeting_area";
  return "observation";
}

export function getBonusPoints(notes: string | null | undefined): number {
  if (isMeetingNote(notes)) return MEETING_BONUS_POINTS;
  if (isMeetingAreaNote(notes)) return MEETING_AREA_POINTS;
  return 0;
}
