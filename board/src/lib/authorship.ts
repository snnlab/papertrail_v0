// Authorship-pattern summary (instructor-facing, Phase 1). Derived entirely
// client-side from timestamps the board already has — the decision log's
// entry timestamps and any signed execution plan's "Signed off: <name>,
// <YYYY-MM-DD>" trailer line — no new payload field required.
//
// This is a low-key descriptive clue, NOT a verdict: a project logged across
// many days reads very differently from one where every entry lands the night
// before sign-off, and that difference is worth a glance, but the board never
// colors or blocks anything based on it. Keep any consuming UI neutral.
import type { ParsedLogEntry } from "./types";

export interface AuthorshipPattern {
  entryCount: number;
  distinctDays: number;
  firstEntryAt: string; // "YYYY-MM-DD HH:MM"
  lastEntryAt: string; // "YYYY-MM-DD HH:MM"
  signOffDate: string | null; // YYYY-MM-DD; the most recent signed plan found
  daysFirstEntryToSignOff: number | null; // whole days, floor(elapsed); can be 0
}

const DATE_RE = /\d{4}-\d{2}-\d{2}/;

function toUtcMidnightMs(dateOnly: string): number {
  return Date.parse(`${dateOnly}T00:00:00Z`);
}

/**
 * Summarizes WHEN the decision log was written: how many distinct calendar
 * days it spans, and roughly how long passed between its first entry and the
 * most recent plan sign-off. `signedOffLines` is whatever a plan's trailer
 * carried after "Signed off: " (e.g. "BK, 2026-07-18") for every signed
 * version across the project — pass in the raw strings, this extracts dates.
 * Returns null when there is no decision log to summarize.
 */
export function computeAuthorshipPattern(
  entries: Pick<ParsedLogEntry, "timestamp">[],
  signedOffLines: (string | null | undefined)[],
): AuthorshipPattern | null {
  if (entries.length === 0) return null;
  const days = new Set(entries.map((e) => e.timestamp.slice(0, 10)));
  const firstEntryAt = entries[0].timestamp;
  const lastEntryAt = entries[entries.length - 1].timestamp;

  const signOffDates = signedOffLines
    .map((l) => (l ? DATE_RE.exec(l)?.[0] ?? null : null))
    .filter((d): d is string => d !== null)
    .sort();
  const signOffDate = signOffDates.length ? signOffDates[signOffDates.length - 1] : null;

  // Calendar-day distance from the log's first DAY to the sign-off DAY (not a
  // raw timestamp diff — a first entry logged late in the evening must not
  // read as a negative gap when the plan is signed off the same calendar day).
  const daysFirstEntryToSignOff =
    signOffDate != null
      ? Math.round(
          (toUtcMidnightMs(signOffDate) - toUtcMidnightMs(firstEntryAt.slice(0, 10))) / 86_400_000,
        )
      : null;

  return {
    entryCount: entries.length,
    distinctDays: days.size,
    firstEntryAt,
    lastEntryAt,
    signOffDate,
    daysFirstEntryToSignOff,
  };
}

/** A neutral one-line description for the summary chip, e.g.
 * "14 entries across 6 days · signed 12 days after the first entry" or
 * "14 entries across 1 day · signed the same day as the first entry". */
export function describeAuthorshipPattern(p: AuthorshipPattern): string {
  const dayWord = p.distinctDays === 1 ? "day" : "days";
  const entryWord = p.entryCount === 1 ? "entry" : "entries";
  const base = `${p.entryCount} ${entryWord} across ${p.distinctDays} ${dayWord}`;
  if (p.daysFirstEntryToSignOff == null) return base;
  if (p.daysFirstEntryToSignOff <= 0) return `${base} · signed the same day as the first entry`;
  const gapWord = p.daysFirstEntryToSignOff === 1 ? "day" : "days";
  return `${base} · signed ${p.daysFirstEntryToSignOff} ${gapWord} after the first entry`;
}
