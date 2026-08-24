# Changelog

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
