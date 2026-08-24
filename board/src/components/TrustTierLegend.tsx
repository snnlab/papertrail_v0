import { useState } from "react";

// Roster trust tiers (Phase 2 — instructor-hosted classroom server). Every
// signal shown on the roster falls into exactly one of three tiers, by where
// its confidence actually comes from — not every badge means the same thing,
// and this legend exists specifically so an instructor does not glance at a
// green checkmark and a "worth a look" flag and read them as the same kind
// of claim. Kept tonally identical to lib/authorship.ts: descriptive, never
// accusatory, never a verdict.
//
// Iconography here is deliberately its own vocabulary — NOT the "⚠ integrity
// concern" rose badge FeedbackPanel.tsx already uses for an instructor's own
// manual comment flag (see AnnotationLayer's `category: "integrity"`). That
// badge is a human's judgment call on one comment; this legend describes what
// the SERVER computed, mechanically or otherwise. Reusing its icon/color here
// would blur two genuinely different things.
interface Tier {
  id: string;
  icon: string;
  iconLabel: string;
  label: string;
  description: string;
  examples: string;
  iconCls: string;
}

const TIERS: Tier[] = [
  {
    id: "mechanical",
    icon: "✓",
    iconLabel: "checkmark",
    label: "Mechanically re-verified",
    description:
      "The server independently recomputed this from what was submitted; a mismatch here is a strong signal.",
    examples:
      "Checksums, artifact references, findings-sourced checks, the F·A·I score arithmetic, trailer grammar.",
    iconCls:
      "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
  },
  {
    id: "descriptive",
    icon: "\u{1F50D}",
    iconLabel: "magnifying glass",
    label: "Descriptive, not proof",
    description:
      "Computed mechanically, but it's a clue, not a verdict — read the detail before drawing a conclusion.",
    examples: "Sign-off date vs. git commit timing, cross-student similarity signals.",
    iconCls:
      "border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300",
  },
  {
    id: "self-attested",
    icon: "ℹ",
    iconLabel: "info",
    label: "Self-attested, unverifiable",
    description:
      "Reflects what the student's AI session reported or the plan claims; the server cannot independently confirm it.",
    examples: "Sign-off names, rubric channel scores, reported model usage, validation verdicts.",
    iconCls:
      "border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400",
  },
];

export default function TrustTierLegend() {
  const [open, setOpen] = useState(true);
  return (
    <section className="mb-4 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
          How to read these signals
        </span>
        <span className="text-xs text-stone-400 dark:text-stone-500">
          {open ? "hide" : "show"}
        </span>
      </button>
      {open && (
        <div className="border-t border-stone-100 dark:border-stone-800 px-4 py-3">
          <p className="mb-3 text-xs text-stone-500 dark:text-stone-400">
            Three tiers, by where the confidence actually comes from — a mechanical
            recheck, a descriptive clue, and a self-report are not the same kind of claim,
            even when they sit in the same row.
          </p>
          <dl className="grid gap-3 sm:grid-cols-3">
            {TIERS.map((t) => (
              <div
                key={t.id}
                className="rounded-md border border-stone-100 dark:border-stone-800 p-2.5"
              >
                <dt className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
                  <span
                    aria-hidden
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${t.iconCls}`}
                    title={t.iconLabel}
                  >
                    {t.icon}
                  </span>
                  {t.label}
                </dt>
                <dd className="text-[11px] leading-snug text-stone-500 dark:text-stone-400">
                  {t.description}
                  <div className="mt-1 text-stone-400 dark:text-stone-500">{t.examples}</div>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
