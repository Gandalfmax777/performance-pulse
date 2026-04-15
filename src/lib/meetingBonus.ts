export const MEETING_NOTE_PREFIX = "[REUNIAO]";
export const MEETING_BONUS_POINTS = 10;

export function isMeetingNote(notes: string | null | undefined): boolean {
  if (!notes) return false;
  return notes.trimStart().startsWith(MEETING_NOTE_PREFIX);
}

export function stripMeetingPrefix(notes: string): string {
  return notes.trimStart().slice(MEETING_NOTE_PREFIX.length).trim();
}
