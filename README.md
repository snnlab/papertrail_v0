# papertrail

> Stay the author of your paper when a coding agent does the analysis.

## 왜 PaperTrail인가

전통적인 대학원 도제 시스템 — **학생-교수(2자 체제)** — 은 구조적인 병목을 안고 있습니다. 교수자의 시간은 절대적으로 부족하고, 학생은 논리적 비약이나 방법론적 허점을 안은 채 다음 면담까지 기다려야 하며, 그사이 교수자는 정작 중요한 사회학적 함의보다 기초적인 코드 오류나 표 형식을 고치는 데 피드백 시간을 소모하게 됩니다. 그 이면에서 어떤 결측치가 무시되었는지, 모형이 어떻게 임의로 수정되었는지는 완전히 블랙박스에 갇힙니다.

PaperTrail은 여기에 AI를 끼워 넣어 **학생-AI-교수(3자 체제)**로 진화시키는 도구입니다. AI를 대체물이 아니라, 학생과 교수 사이의 마찰열을 흡수하는 완충재이자 촉매제로 씁니다.

- **인지적 병목 해소.** 학생이 기초적인 통계 코드 작성과 데이터 정제에 쏟는 시간을 줄이고, 연구 설계와 사회학적 함의 도출이라는 본질에 집중하게 합니다.
- **지치지 않는 사전 리뷰어.** AI가 논리적 비약과 방법론적 허점을 먼저 공격해, 학생이 교수를 만나기 전 스스로 방어 논리를 훈련하도록 합니다 — '지연된 교정'을 '실시간 스파링'으로 바꿉니다.
- **교수자 역할의 승격.** 교수자는 뻔한 코드 오류나 표 형식을 교정하는 데 시간을 낭비하지 않고, 이론적 기여도 같은 차원 높은 지적 멘토링에만 집중할 수 있습니다.
- **저자성(authorship)의 강제.** AI가 임의로 분석을 시작하지 못합니다. 학생이 실행 계획을 사전에 확인하고 서명(sign)해야만 코드가 실행되므로, 결과에 대한 책임은 항상 학생에게 남습니다 — '정답을 기다리는 수동적 실행자'가 아니라 스스로 방법론을 변호하는 '연구 설계자'로 성장하게 됩니다.

이 원칙들은 도구 안의 구체적인 메커니즘으로 구현되어 있고, 각각은 학술적 진정성(academic integrity)을 지키는 역할을 맡습니다:

| 메커니즘 | academic-integrity 목적 |
|---|---|
| **결정 로그 (decision log)** | 방법론적 선택의 근거(예: CLPM과 RI-CLPM 분석결과를 비교한 뒤 특정 모형을 채택한 이론적 이유)가 휘발성 대화로 사라지지 않고 타임스탬프와 함께 불변의 로그로 영구 기록됩니다. |
| **사인오프 게이트 (sign-off gate)** | 학생이 실행 계획에 먼저 서명해야만 AI가 분석을 실행할 수 있습니다 — 저자성을 기계적으로 강제합니다. |
| **이탈 플래깅 (deviation flagging)** | 계획과 다르게 실행된 부분(결측치 임의 처리, 모형 임의 단순화 등)은 조용히 넘어가지 않고 즉시 위반(breach)으로 깃발이 꽂히고 기록됩니다. |
| **결과물 번들 (results bundle)** | 교수에게 보고할 도표와 계수표가 정확히 어떤 스크립트에서 나왔는지 체크섬으로 추적 가능한 번들로 봉인되어, 보고 수준의 신뢰도를 보장합니다. |

이 모든 기록이 브라우저 보드 위에 하나로 모입니다. 교수자는 최종 결과물만이 아니라, 학생이 연구를 진행한 논리적 궤적 전체를 투명하게 들여다보고 코멘트를 남길 수 있습니다 (보드는 코멘트 전용이며, 계획을 승인하거나 서명하는 권한은 항상 학생에게 있습니다).

---

## What you get

Coding agents can produce plausible analyses faster than you can track why each one exists — five versions of a figure, three model specifications, and no record of which one made it into the draft, or why. PaperTrail keeps you in charge of that. It's a [Claude Code](https://claude.com/claude-code) plugin, built for a graduate quantitative-methods course: the agent works from a short plan you sign at the execution gate *before* it runs — what the work will do, why, and how you'll know it worked — then records every revision, decision, and result against that plan. You stay the author of the choices and the interpretation; the agent does the work and keeps the books.

It's the commit-before-you-look discipline you know from preregistration, made into a living plan rather than a frozen registry entry. It won't make an analysis correct — it makes the plan you approved, and every deviation from it, something you (and your instructor) can actually see.

Five artifacts, each one an answer to *"what did the AI actually do, and can I stand behind it?"*

- **A plan you sign before the work.** For each piece of the paper — a data-cleaning pass, one analysis, a robustness check — you and the agent co-author a short execution plan: its goal, the scope decisions and why you made them, the steps, and how you'll judge success. The draft stays pending until `/execute` opens a slim sign session, or you run `/sign` sooner. Nothing is signed until you approve it, and signing is enforced, not suggested (see [the sign-off gate](docs/reference.md#the-sign-off-gate)).
- **A decision log written as decisions happen.** Every choice you and the agent make lands in an append-only, timestamped log — not reconstructed afterward from memory, when the reasons have already blurred.
- **Plan versions that are immutable.** When execution teaches you something and the plan changes, `/sync` records a new amendment version that says what changed and why. The old version is never edited. Re-execution signs a fresh commitment to that amendment. A recorded revision is legitimate; only a silent deviation is a breach.
- **Results you can verify.** Each analysis is captured as an immutable results bundle: the figures and tables (checksum-verified against the scripts that made them), the exact code, the key numbers, an automatic plan-vs-execution audit, and a mechanical score for how well the work held to its plan. Re-running an analysis can never quietly change what you already verified — a redo is the next bundle.
- **A board that shows all of it.** A browser dashboard renders the whole project — the tracker, every plan and its diffs, the results, the decisions, the reviews — so you and your instructor can actually read what happened. Nobody has to trust a chat log they'll never see.

## How it works in practice

The plugin adds a handful of commands to Claude Code. A normal paper moves through a loop, and the agent carries the bookkeeping at every step.

**1. Opt a project in** — `/papertrail:init`. A short interview opens with the paper itself (working title, what it's about), then the research questions, the data, and the course/deadline context. It seeds the master plan: the research questions, and the components (analysis steps) that serve them. Everything else is opt-in; the plugin does nothing in projects you haven't initialized.

**2. Scope a plan** — `/papertrail:plan`. You and the agent scope the next component and prepare a scored draft. The board is available for reading, annotations, extra reviews, and a diff against the prior version. The draft stays pending, and the tracker marks the component `planned`. If the draft's "Decisions and reasons" score comes back below 2/3, the AI recommends revising it before you sign — and if you sign anyway, that override is logged to the decision log explicitly, not absorbed silently.

**3. Sign and execute the loop** — `/papertrail:execute`. A slim sign session shows the pending plan exactly as it will be committed. You approve it or request changes. Then one prompt asks whether to run now, which model to use, and whether to make a report. The agent commits the signed plan, executes it, captures and validates the bundle, reports when requested, updates the tracker and log, suggests one commit, opens the board, and proposes the next component. The plan is the spine it works against, not a cage; interpretive choices still come back to you before the agent acts. Run `/papertrail:sign` when you want to sign pending plans without starting execution.

**4. Recover work outside the loop** — `/papertrail:sync`. This manual checkpoint handles work done outside `/execute`, crashed sessions, hosted comments, and decisions that did not get logged. It updates the tracker and records an amendment automatically when confirmed execution deviated from the plan. The amendment says what changed and why; the old version is never edited. Re-execution must sign a new commitment first. Deviation is not failure; unrecorded deviation is.

**5. Capture results manually when needed** — `/papertrail:results`. The execution loop normally does this for you. The direct command seals a versioned, immutable bundle for out-of-loop work or a recapture: an agent-drafted report, snapshot copies of the figures and tables (checksum-verified against the scripts that made them), the code, the key numbers as tiles, and an automatic validation — an independent check comparing the governing signed plan or recorded amendment against what actually ran.

**6. Write the report** — `/papertrail:report`. Assembles a standalone report from a results bundle — background, data and methods, findings with embedded figures/tables, a validation summary, a provenance appendix, and an **AI Assistance Disclosure** table built from the model-usage data already captured at each stage (plan, execute, review, validation), pointing back to the decision log and the bundle as the verifiable record.

**7. Review, reopen, share** — `/papertrail:board`. Open the dashboard. Read a plan and its revision history, annotate a draft, or review a results bundle: validation compares the governing plan with what executed, step by step, and defines the bundle's standing state. Reopen any finalized bundle with comments to drive a fix and a new capture. Share the whole thing with your instructor, who only needs a browser — they can comment, but the board has no plan-approval action for anyone but you. Plan approval always stays in your own slim sign session.

The board runs on `python3` alone — nothing to install — as a small local server, or as a single self-contained HTML file you can email. It does not need Claude to open: every board open leaves a `./pt-board` script in the project, so a terminal command gets you the dashboard with no model in the loop, which matters on the day your session is rate-limited. Sharing to a private, password-protected link for a browser-only instructor is one more step (it uses Vercel and needs Node.js once, to set up). Full details are in the [reference](docs/reference.md#the-board).

## Who it's for

PaperTrail is for a specific kind of work, not everyone who touches an AI.

It pays off when you are **already using a coding agent for real analysis** — data cleaning, modeling, robustness checks — on a **quantitative-methods final paper you'll have to defend**: to your instructor now, and to yourself later when you can't remember why you dropped those 40 cases. The plan-and-sign step costs you something up front; its value grows with every revision, every session, and every point where your instructor needs to see why, not just what.

It is **not for one-off, throwaway exploration** — a quick plot to answer a question you'll forget by Friday doesn't need a durable record, and the workflow would just be friction. And an instructor who only reads the board is a beneficiary, not a user: they never run a command, and they can never sign or approve a plan — that stays the student's job, by design.

If you're **curious about agents but wary** of turning one loose on your analysis, this is a way in. The point of the plan is that the agent's autonomy has a boundary you set and can see.

## Principles

- Plans are written before the work and govern it. A plan is a contract with a built-in amendment process, not a preregistration: a recorded revision is legitimate and expected; only a silent deviation is a breach.
- Plan versions are immutable. Revisions are new files that say what changed and why.
- The decision log is written as decisions happen, never backfilled.
- The student decides and signs. The AI asks, drafts, critiques, and keeps the books — but it never writes the paper's sociological interpretation on the student's behalf (see CLAUDE.md rule 11 in [claude-md-section.md](skills/managing-papertrail/templates/claude-md-section.md)).

The quality rubric bundled with the plugin (`docs/plan-rubric.md`, and the runtime copy at `skills/managing-papertrail/references/plan-rubric.md`) is adapted from the [Planboard](https://github.com/letitbk/planboard) project's plan-quality rubric — PaperTrail itself is a fork of Planboard, retargeted from a solo-researcher tool to this student–AI–instructor workflow.

## Install

In Claude Code:

```
/plugin marketplace add DS3693/papertrail
/plugin install papertrail@papertrail
```

Then restart Claude Code, and run `/papertrail:init` in a project to opt it in. See [QUICKSTART.md](QUICKSTART.md) for a walkthrough.

The core plan-review-execute-tail workflow needs only `python3` (no dependencies); `/sync` is the manual recovery checkpoint. The optional private web sharing additionally needs Node.js. Updating, pinning to a specific version, silencing update notices, and everything else is in the [reference](docs/reference.md).

## Reference

Everything technical lives in **[docs/reference.md](docs/reference.md)**: the full command table, the board in depth (live vs. snapshot, every view, sharing and private web publishing), results bundles, model profiles, the sign-off gate, what the plugin creates in your project, updating and version pinning, and how to develop the board itself.

## License

[PolyForm Noncommercial License 1.0.0](LICENSE). Free to use, modify, and share for any **noncommercial** purpose — academic research, teaching, personal, and non-profit use all qualify. Commercial use is not permitted without a separate license.
