# Changelog

## [0.3.0] - 2026-08-25

Closes a gap in the roster server (v0.2.0): drilling into a student's board from the roster dashboard had no way to actually leave a comment, and nothing told a student one had been left. Both are now real, in keeping with the existing "no push notifications anywhere in this tool" design: the instructor's comment is stored, and a student finds out only by running `/papertrail:submit`, which now also checks their own submissions for anything new.

### Added
- **Instructor comments on a submitted board.** Drilling into a student's board from the roster reuses the exact same hosted-comment flow a `--publish-web` collaborator link already has (select text, leave a comment) — `board/src/views/Roster.tsx` marks the drilled-in payload `mode: "hosted"` so `App.tsx`'s existing comment machinery fires unmodified. The classroom server gained `GET/POST /api/comments` (`skills/managing-papertrail/assets/classroom-template/{lib,api}/comments.ts`), storing comments scoped by `shareHash` (a submission's content hash), resolved to a student via a new `submission-index/` reverse lookup written at submission-accept time. Reads are authorized either by the instructor's session (any student) or a student's own bearer token (their own submissions only, never another student's).
- **A student learns about a comment by running `/papertrail:submit`.** No email, no webhook — consistent with this tool never sending anything on its own. Every submit now also fetches the student's own comments (`skills/managing-papertrail/scripts/submit.py`'s `check_for_new_comments`), diffs against a locally remembered "seen" set keyed by shareHash, and prints anything new under an "Instructor feedback" heading.
- **A "new" badge on the roster table** for any row submitted since the instructor's last visit to the dashboard (`isNewSinceLastView`, computed server-side from a single last-viewed pointer in `lib/roster.ts` — there being only one instructor login, no per-person state is needed).

### Changed
- `board/src/App.tsx`'s hosted-comment fetch now includes `?shareHash=` in its `GET /api/comments` call — a no-op for the existing single-project `web-template` deploy (one project, one shareHash-space, the extra query param is ignored), required for the classroom server to know which student's comments to return.
- `docs/hosting-the-roster.md` and the README's roster section now describe this accurately — they previously undersold what the drill-down view could do (nothing) and oversold it (comment-capable) at different points; both are now correct.

## [0.2.0] - 2026-08-25

Adds an instructor-hosted classroom roster server: students submit their project state to one central, multi-tenant server (separate from the existing single-project `--publish-web` sharing) so the instructor reviews everyone from one dashboard instead of opening each student's board individually.

### Added
- **`/papertrail:submit`** (`commands/submit.md`, `skills/managing-papertrail/scripts/submit.py`) — packages a student's current project state (`collect_payload` + inlined artifacts + a bounded git-log excerpt of `plans/`, commit hash/date/author/subject only, no diffs or code) into a versioned envelope and submits it to the instructor's server. Always shows a full preview (components, versions, results bundles, commit range, size) and requires explicit confirmation before sending — never silent. Idempotent: resubmitting identical content is a no-op.
- **`/papertrail:host`** (`commands/host.md`) — instructor command to stand up and administer the classroom server: first-run Vercel setup (`--init`), student registration/token minting (`--add-student` / `--roster <file>`), redeploy (`--deploy`), opening the dashboard (`--roster-view`), and token rotation (`--rotate-token`). Never gains a sign/approve action — the "comment-only instructor role" invariant carries over unchanged.
- **`skills/managing-papertrail/assets/classroom-template/`** — a new, parallel Vercel deployment template (alongside the existing single-project `web-template/`) for the multi-tenant server: per-student bearer tokens (never a shared password), an instructor-only login session, and Blob-backed roster/submission storage.
- **Server-side mechanical re-verification** on every submission: independently recomputes each results bundle's checksum/artifact-reference integrity and F·A·I score from the submitted bytes (never trusts the client-sealed values), re-checks each signed plan's sign-off trailer grammar, and cross-checks sign-off dates against the submitted git-log excerpt for a timing-based flag. Content-level mismatches are always stored and flagged, never rejected — only a malformed or oversized envelope is refused.
- **Cross-student similarity signal** (`/papertrail:host` dashboard, instructor-triggered) — k-shingling + Jaccard similarity over normalized decision-log text, surfaced as a neutral "worth a look" flag with a concrete shared-phrase example. No automatic consequence.
- **Roster dashboard** (`board/src/views/Roster.tsx`, `board/src/RosterApp.tsx`) — a new view, additive to the existing single-project board (no changes to `Tracker`/`PlanReader`/`Results`/`Timeline`/etc.). Each row deep-links into that student's full board, rendered by the same unmodified single-project UI. Includes a **trust-tier legend** distinguishing mechanically re-verified checks from descriptive/timing-derived signals from self-attested claims, so a green check is never over-trusted.
- `docs/hosting-the-roster.md` — setup/troubleshooting/privacy guide for the classroom server, with an explicit callout that it now aggregates every registered student's decision log and git history in one place.

### Fixed
- `board/package.json`'s version had drifted to a stale `1.1.0` inherited from the Planboard fork instead of tracking `.claude-plugin/plugin.json`; both are now `0.2.0` per this project's own version-parity rule.

## [0.1.0] - 2026-08-24

Initial release of PaperTrail, forked from [Planboard](https://github.com/letitbk/planboard) v1.1.0 and retargeted from a solo-researcher tool into a plan-based bridge between a graduate student, their AI assistant, and their instructor for a quantitative-methods final paper. The plan/sign-off/decision-log/results-bundle mechanics carry over unchanged; the naming, prose, and a handful of academic-integrity controls are new.

### Changed
- **Renamed to papertrail.** Every case-variant of "planboard" is now "papertrail"/"PaperTrail"/"PAPERTRAIL", including `PAPERTRAIL_*` env vars and the `<!-- papertrail:master-plan/start/end -->` markers. Provenance markers `<!-- pb-model -->` / `<!-- pb-report -->` are now `<!-- pt-model -->` / `<!-- pt-report -->`; generated review agents `pb-plan-reviewer` / `pb-results-validator` / `pb-board-reviewer` are now `pt-plan-reviewer` / `pt-results-validator` / `pt-board-reviewer`; the no-LLM board launcher is now `./pt-board`; the sign-session ticket file is `.papertrail-approved-<slug>-v<N>`.
- **Retargeted from researcher+AI to student+AI+instructor.** Commands, the skill brain, and templates are rewritten for a graduate student writing a sociology quantitative-methods final paper, with the instructor as a comment-only board participant (unchanged mechanically from the prior "collaborator" role — still no sign/approve capability).
- **`master-plan.md` template** — header "Master Plan" → "Paper Plan"; the Components table's `Component` column is now `Analysis step`.
- **`execution-plan.md` template** — header "Execution Plan" → "Analysis Plan"; the 8-section structure is unchanged.
- **`CLAUDE.md` conventions (rule 7)** — rewritten from target-journal vector-PDF/typeset-table output conventions to coursework deliverable conventions (APA/ASA citations, paper-ready figures/tables, deadline awareness).
- **Plan rubric** — moved from `docs/plan-rubric-v0.4.md` to `docs/plan-rubric.md`; the five channels and their 0–3 anchors are unchanged. The empirical methods note (Planboard's own 14-project provenance) was replaced with a one-line attribution back to the Planboard project.
- **`.claude-plugin/plugin.json` / `marketplace.json`** — new description, `"author": {"name": "PaperTrail contributors"}`, version reset to `0.1.0`, `homepage`/`repository` left as placeholders pending a hosting decision.

### Added
- **Low-Decisions sign-off guard** (`/papertrail:plan`, `/papertrail:sign`). Before a plan whose "Decisions and reasons" rubric channel scores below 2/3 is signed, the AI must recommend revising it first; signing anyway is logged to `decision-log.md` as an explicit override entry.
- **Retrospective-adoption warning** (`/papertrail:adopt`). A callout against using retrospective adoption to backfill legitimacy for a graded component without instructor approval, pointing to the rubric's `unsupported-sources` integrity flag as the existing mechanical safeguard.
- **AI Assistance Disclosure** (`/papertrail:report`). Every generated report now renders a disclosure table from the `modelUsage` data already captured per plan/results bundle, listing which stages used which model, with a pointer to the decision log and results bundle as the verifiable record.
- **No-AI-authored-interpretation rule** (`CLAUDE.md` rule 11). The AI may draft directions, play devil's advocate, and critique, but must never write the paper's sociological interpretation on the student's behalf; a drafted starting point must be flagged in the decision log until the student has revised it in their own words.

### Removed
- **All `research-plans`/`RESEARCH_PLANS_*`/`rp-*` migration-compatibility code.** Planboard carried dual-read support for its own prior name (`research-plans`) across markers, environment variables, generated agent filenames, the board launcher, and a hosted-config directory fallback. PaperTrail has no prior installs to migrate from, so all of that compatibility layer was deleted outright rather than renamed — this is a clean break, not a rename-in-place.
- **`docs/plans/`, `docs/specs/`, `docs/evaluation/`, `docs/images/`, `docs/ROADMAP.md`, `docs/RELEASING.md`** — Planboard's own dev-history, CI, and screenshot artifacts, not applicable to this fork.
- **`.github/`, `scripts/check_pr_policy.py`, `scripts/new-walkthrough.py`** — Planboard's own CI and dev-tooling scripts.
- **`commands/handoff.md`, `skills/managing-papertrail/scripts/handoff.py`** — the Codex-handoff command, out of scope for this fork.
- **`tests/test_rename_compat.py`, `tests/test_check_pr_policy.py`, `tests/test_handoff.py`** — tests for the removed compatibility layer, CI policy, and handoff command.
