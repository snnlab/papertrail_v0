import { useMemo, useState } from "react";
import App from "../App";
import OutputScorePanel from "../components/OutputScorePanel";
import TrustTierLegend from "../components/TrustTierLegend";
import type {
  ReverifyCheck,
  RosterData,
  RosterIntegrityStatus,
  RosterRow,
  SimilarityFlag,
  StudentFetchState,
  StudentSubmission,
} from "../lib/rosterTypes";

type SortKey = "name" | "submitted" | "score" | "integrity" | "similarity";
type SortDir = "asc" | "desc";

// Same visual vocabulary Results.tsx already uses for IntegrityBlock (see
// INTEGRITY_CLS there) plus a muted "unknown" tier for a submission the
// server hasn't run its mechanical pass against yet — kept identical on
// purpose so an instructor doesn't have to learn a second color meaning the
// same thing.
const INTEGRITY_CLS: Record<RosterIntegrityStatus, string> = {
  passed:
    "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-300",
  failed:
    "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200",
  unknown:
    "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 text-stone-400 dark:text-stone-500",
};

// Reverify checks are softer, descriptive signals (see TrustTierLegend) —
// deliberately NOT the integrity block's red/green/amber pass-fail
// vocabulary, and NOT FeedbackPanel's rose "⚠ integrity concern" badge. A
// distinct, cooler palette per status.
const REVERIFY_CLS: Record<ReverifyCheck["status"], string> = {
  match:
    "border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300",
  mismatch:
    "border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-950 text-violet-800 dark:text-violet-300",
  "not-derivable":
    "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 text-stone-400 dark:text-stone-500",
  flag:
    "border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300",
};

const SIMILARITY_CLS =
  "border-fuchsia-300 dark:border-fuchsia-800 bg-fuchsia-50 dark:bg-fuchsia-950 text-fuchsia-800 dark:text-fuchsia-300";

function fmtDate(iso: string): string {
  return iso.length >= 16 ? iso.slice(0, 16).replace("T", " ") : iso;
}

function scoreTotal(row: RosterRow): number {
  return row.lastSubmission?.score?.total ?? -1;
}

function integrityRank(status: RosterIntegrityStatus | undefined): number {
  switch (status) {
    case "failed":
      return 0;
    case "unknown":
      return 1;
    case "passed":
      return 2;
    default:
      return 3; // never submitted
  }
}

function sortRows(rows: RosterRow[], key: SortKey, dir: SortDir): RosterRow[] {
  const sorted = [...rows].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "name":
        cmp = a.displayName.localeCompare(b.displayName);
        break;
      case "submitted": {
        const at = a.lastSubmission?.submittedAt ?? "";
        const bt = b.lastSubmission?.submittedAt ?? "";
        cmp = at.localeCompare(bt);
        break;
      }
      case "score":
        cmp = scoreTotal(a) - scoreTotal(b);
        break;
      case "integrity":
        cmp =
          integrityRank(a.lastSubmission?.integrityStatus) -
          integrityRank(b.lastSubmission?.integrityStatus);
        break;
      case "similarity":
        cmp = a.similarityFlags.length - b.similarityFlags.length;
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-2">
      <button
        type="button"
        className={`inline-flex items-center gap-1 font-medium ${
          active ? "text-stone-800 dark:text-stone-200" : "text-stone-500"
        }`}
        onClick={onClick}
      >
        {label}
        {active && <span aria-hidden>{dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}

/** A compact chip that expands (native <details>) to the full list of checks.
 * The chip color reflects the least-reassuring status present, but each
 * expanded entry keeps its own status color — never collapsed to one signal. */
function ReverifyCell({ checks }: { checks: ReverifyCheck[] }) {
  const worst: ReverifyCheck["status"] = checks.some((c) => c.status === "mismatch")
    ? "mismatch"
    : checks.some((c) => c.status === "flag")
      ? "flag"
      : checks.every((c) => c.status === "not-derivable")
        ? "not-derivable"
        : "match";
  return (
    <details onClick={(e) => e.stopPropagation()}>
      <summary
        className={`inline-flex cursor-pointer list-none items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${REVERIFY_CLS[worst]}`}
      >
        {checks.length} check{checks.length === 1 ? "" : "s"}
      </summary>
      <ul className="mt-1 max-w-xs space-y-1 text-[11px]">
        {checks.map((c, i) => (
          <li key={i} className="flex flex-wrap items-baseline gap-1.5">
            <span
              className={`rounded border px-1 text-[10px] font-medium ${REVERIFY_CLS[c.status]}`}
            >
              {c.status}
            </span>
            <span className="font-medium text-stone-700 dark:text-stone-300">{c.check}</span>
            <span className="text-stone-500">{c.detail}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function SimilarityCell({ flags }: { flags: SimilarityFlag[] }) {
  return (
    <details onClick={(e) => e.stopPropagation()}>
      <summary
        className={`inline-flex cursor-pointer list-none items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${SIMILARITY_CLS}`}
      >
        {flags.length} flag{flags.length === 1 ? "" : "s"}
      </summary>
      <ul className="mt-1 max-w-xs space-y-1 text-[11px] text-stone-600 dark:text-stone-400">
        {flags.map((f, i) => (
          <li key={i}>
            vs. <span className="font-medium text-stone-800 dark:text-stone-200">{f.withStudentId}</span>{" "}
            — jaccard {f.jaccard.toFixed(2)} ({f.artifact})
          </li>
        ))}
      </ul>
    </details>
  );
}

function StudentError({
  message,
  unauthorized,
  onRetry,
}: {
  message: string;
  unauthorized?: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-10 text-center text-sm text-amber-900 dark:text-amber-200">
      <p>{message}</p>
      {unauthorized ? (
        <a
          href="/login"
          className="mt-3 inline-block rounded-md bg-stone-900 dark:bg-stone-200 px-3 py-1.5 text-xs font-medium text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-400"
        >
          Log in again
        </a>
      ) : (
        <button
          type="button"
          className="mt-3 rounded-md border border-amber-400 dark:border-amber-700 px-3 py-1.5 text-xs font-medium hover:border-amber-600 dark:hover:border-amber-500"
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </div>
  );
}

/** The drilled-in view: renders the EXISTING, unmodified App.tsx with one
 * submission's payload (App already accepts BoardData as a prop). A floating
 * panel — not part of App's own layout — carries the "back to roster"
 * affordance plus this submission's integrity/reverify signals and, when a
 * student has more than one submission, a switcher between them. Floating
 * (fixed) rather than in-flow so it never collides with App's own sticky
 * header. */
function StudentBoard({
  submissions,
  onBack,
}: {
  submissions: StudentSubmission[];
  onBack: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const sub = submissions[Math.min(idx, submissions.length - 1)] ?? null;

  return (
    <>
      <div className="fixed bottom-4 left-4 z-40 max-w-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-3 text-xs shadow-lg">
        <button
          type="button"
          className="mb-2 rounded-md border border-stone-300 dark:border-stone-600 px-2.5 py-1 text-xs font-medium text-stone-700 dark:text-stone-300 hover:border-stone-500 dark:hover:border-stone-400"
          onClick={onBack}
        >
          ← Back to roster
        </button>
        {sub && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full border px-1.5 py-0.5 font-semibold uppercase tracking-wide ${INTEGRITY_CLS[sub.integrityStatus]}`}
            >
              {sub.integrityStatus}
            </span>
            {sub.reverify.length > 0 && <ReverifyCell checks={sub.reverify} />}
          </div>
        )}
        {submissions.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {submissions.map((s, i) => (
              <button
                key={s.idempotencyKey}
                type="button"
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  i === idx
                    ? "border-stone-900 bg-stone-900 dark:bg-stone-200 text-white dark:text-stone-900"
                    : "border-stone-300 dark:border-stone-600 text-stone-600 hover:border-stone-500 dark:hover:border-stone-400"
                }`}
                onClick={() => setIdx(i)}
              >
                {fmtDate(s.submittedAt)}
              </button>
            ))}
          </div>
        )}
      </div>
      {sub ? (
        <App data={sub.payload} />
      ) : (
        <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-950">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            This student has no captured submissions yet.
          </p>
        </div>
      )}
    </>
  );
}

/** Instructor-facing roster dashboard (Phase 2): a sortable table of every
 * registered student's latest submission, modeled on Archive.tsx/Timeline.tsx
 * as "browse a collection of records" templates. Clicking a row fetches that
 * student's full submission history and hands the latest payload to the
 * existing, unmodified App.tsx — drilling in is "render the single-project
 * board with this payload," not a new rendering path. */
export default function Roster({ data }: { data: RosterData }) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<{ studentId: string; displayName: string } | null>(
    null,
  );
  const [studentState, setStudentState] = useState<StudentFetchState>({ status: "loading" });

  const rows = useMemo(
    () => sortRows(data.students, sortKey, sortDir),
    [data.students, sortKey, sortDir],
  );

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const openStudent = async (studentId: string, displayName: string) => {
    setSelected({ studentId, displayName });
    setStudentState({ status: "loading" });
    try {
      const res = await fetch(`/api/submissions/${encodeURIComponent(studentId)}`, {
        credentials: "include",
      });
      if (res.status === 401) {
        setStudentState({
          status: "error",
          message: "Your instructor session has expired.",
          unauthorized: true,
        });
        return;
      }
      if (!res.ok) {
        setStudentState({
          status: "error",
          message: `Couldn't load this student's submissions (HTTP ${res.status}).`,
        });
        return;
      }
      const json = await res.json();
      setStudentState({ status: "ready", data: json });
    } catch {
      setStudentState({ status: "error", message: "Couldn't reach the classroom server." });
    }
  };

  const backToRoster = () => setSelected(null);

  if (selected) {
    return (
      <>
        {studentState.status === "loading" && (
          <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-950">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Loading {selected.displayName}'s submissions…
            </p>
          </div>
        )}
        {studentState.status === "error" && (
          <div className="mx-auto max-w-lg py-10">
            <StudentError
              message={studentState.message}
              unauthorized={studentState.unauthorized}
              onRetry={() => openStudent(selected.studentId, selected.displayName)}
            />
            <button
              type="button"
              className="mt-3 rounded-md border border-stone-300 dark:border-stone-600 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:border-stone-500 dark:hover:border-stone-400"
              onClick={backToRoster}
            >
              ← Back to roster
            </button>
          </div>
        )}
        {studentState.status === "ready" && (
          <StudentBoard submissions={studentState.data.submissions} onBack={backToRoster} />
        )}
      </>
    );
  }

  return (
    <div>
      <TrustTierLegend />
      {data.students.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 p-10 text-center text-sm text-stone-500">
          No students registered yet. Run <code>/papertrail:host --add-student</code> or{" "}
          <code>--roster</code> to add them.
        </div>
      ) : (
        <section className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-left text-xs uppercase tracking-wide text-stone-500">
                  <SortHeader
                    label="Student"
                    active={sortKey === "name"}
                    dir={sortDir}
                    onClick={() => toggleSort("name")}
                  />
                  <SortHeader
                    label="Submission"
                    active={sortKey === "submitted"}
                    dir={sortDir}
                    onClick={() => toggleSort("submitted")}
                  />
                  <SortHeader
                    label="F·A·I score"
                    active={sortKey === "score"}
                    dir={sortDir}
                    onClick={() => toggleSort("score")}
                  />
                  <SortHeader
                    label="Integrity"
                    active={sortKey === "integrity"}
                    dir={sortDir}
                    onClick={() => toggleSort("integrity")}
                  />
                  <th className="px-4 py-2">Reverify</th>
                  <SortHeader
                    label="Similarity"
                    active={sortKey === "similarity"}
                    dir={sortDir}
                    onClick={() => toggleSort("similarity")}
                  />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const sub = row.lastSubmission;
                  const clickable = !!sub;
                  return (
                    <tr
                      key={row.studentId}
                      className={`border-b border-stone-100 dark:border-stone-800 last:border-0 ${
                        clickable
                          ? "cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50"
                          : "opacity-60"
                      }`}
                      onClick={
                        clickable ? () => openStudent(row.studentId, row.displayName) : undefined
                      }
                      title={clickable ? undefined : "No submissions yet"}
                    >
                      <td className="px-4 py-2.5 font-medium text-stone-800 dark:text-stone-200">
                        {row.displayName}
                        {row.submissionCount > 1 && (
                          <span className="ml-1.5 text-[11px] font-normal text-stone-400">
                            ({row.submissionCount} submissions)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {sub ? (
                          <span className="text-stone-600 dark:text-stone-400">
                            {fmtDate(sub.submittedAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-stone-400 dark:text-stone-500">
                            never submitted
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        {sub?.score ? (
                          <OutputScorePanel
                            score={sub.score}
                            sections={{ validation: false, integrity: false }}
                          />
                        ) : (
                          <span className="text-xs text-stone-400 dark:text-stone-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {sub ? (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${INTEGRITY_CLS[sub.integrityStatus]}`}
                          >
                            {sub.integrityStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-stone-400 dark:text-stone-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {sub && sub.reverify.length > 0 ? (
                          <ReverifyCell checks={sub.reverify} />
                        ) : (
                          <span className="text-xs text-stone-400 dark:text-stone-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {row.similarityFlags.length > 0 ? (
                          <SimilarityCell flags={row.similarityFlags} />
                        ) : (
                          <span className="text-xs text-stone-400 dark:text-stone-500">none</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
