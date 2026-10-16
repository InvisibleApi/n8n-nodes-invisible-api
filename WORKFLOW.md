# WORKFLOW.md — Development Process

> The single source of truth for how work is planned, implemented, reviewed, and merged in this repository. Every AI agent and human contributor follows this process. `CONTRIBUTING.md` defines how code is *shaped* (coding standards, node layout); this file defines how work *flows*.

## Roles

- **Maintainers** (the code owners in `.github/CODEOWNERS`) — assign issues, review plans and PRs, merge, cut releases. Decision-makers.
- **Agent (OpenClaw / Codex / other)** — works only on issues explicitly assigned to it; implements, opens PRs, addresses feedback. Never self-selects work, never merges.
- **External contributors** — welcome; see `CONTRIBUTING.md`. The same flow applies, minus the assignment step for small, obviously-right fixes.

> In practice, treat **local gates** and **CI gates** separately: run the full required gate set locally before marking a PR ready, then confirm the CI workflow is green as well.

## Ownership rules

- Act only on issues assigned to you; never touch, start, or claim unassigned issues.
- Monitor and act only on PRs you opened. Ignore others' PRs unless explicitly asked.
- **PR feedback first, always.** Before starting any new work, check your open PRs for comments and resolve them.
- **Never merge.** Maintainers merge. After merge, close the linked issue.
- One issue at a time; after finishing, wait for the next assignment.
- Never push directly to `main` — every change goes through a branch and a PR. Never push tags or bump the version in a feature PR; releases are cut separately (README → Releasing).

## The flow

```
issue assigned → branch → implement (tests + CHANGELOG) → local gates green → PR → CI green → bot review →
address feedback → code-owner review → maintainer merges → issue closed
```

### 1. Branch

Open an issue first for anything beyond a small fix (`CONTRIBUTING.md`), then create the branch **from the issue** — either GitHub's "Create a branch" action on the issue, or the equivalent command:

```bash
git switch main && git pull origin main
gh issue develop {issue-number} --base main --checkout
```

The convention is an issue-prefixed, shell-safe kebab-case name: **`{issue-number}-{short-kebab-slug}`**. Keep the issue number prefix, shorten slugs that would otherwise be noisy, and strip punctuation the issue title may contribute — no `+`, `&`, parentheses, quotes, or repeated separators. A small fix without an issue uses `{type}/{short-kebab-slug}` (`fix/…`, `docs/…`, `chore/…`).

Branch from **`main`** — it is the only long-lived branch and the release branch. Stacked sub-issues branch from the parent issue's branch (`--base {parent-branch}`).

### 2. Implement

- Follow the coding standards and the node layout in `CONTRIBUTING.md`: request building in `actions/`, UI parameters in `descriptions/`, one line in `RESOURCE_HANDLERS` per resource. Reuse the closest existing pattern.
- Write tests with the change, not after the PR: anything under `nodes/InvisibleApi/helpers/` or `transport/` needs a Vitest case in `tests/`. Run the affected operation in a local n8n (`npm run dev`) when the change is visible in the UI.
- Add a **new `##` section at the top of `CHANGELOG.md`** for this work — never append to the section above, even if it is unreleased.
- Keep changes scoped to the issue. One concern per PR: a bug fix and a new operation are two PRs. Scope creep → new issue.

### 3. Gates — all green before the PR is marked ready

| Gate | Command | Enforced in CI (`ci.yml`) |
|---|---|---|
| Lint | `npm run lint` | ✅ |
| Formatting | `npx prettier --check .` (`npm run format` to fix) | ✅ |
| Runtime dependency audit | `npm audit --omit=dev` | ✅ |
| Types | `npm run typecheck` | ✅ |
| Tests | `npm test` (`vitest run`) | ✅ |
| Build | `npm run build` | ✅ |

Use Node 22 and npm ≥ 11.19.1 (the toolchain CI and the publish workflow pin), otherwise `package-lock.json` drifts.

Never announce a PR as ready while a required local gate or the CI workflow is red. No exceptions.

### 4. Open the PR

- **Title:** a concise, descriptive sentence in the imperative (e.g. `Stop shipping tsconfig.tsbuildinfo in the tarball`) — for sub-issues, mirror the issue title.
- **Body:** fill the PR template (`.github/pull_request_template.md`): Summary with `Fixes #{issue}`, Behaviour, Test plan, and the Checklist (CHANGELOG section, no version bump/tag, tests for `helpers/`/`transport/`, no credentials in the diff).
- **Target:** `main`, or the parent issue branch for stacked sub-issues.
- **Size:** if it takes more than ~20–40 minutes to review, split it.

### 5. Review

- Comment **`@codex review`** to trigger the Codex bot review. Address bot feedback before requesting human review — **but verify bot claims against the codebase first**: review bots regularly suggest "fixes" that contradict repo conventions (e.g. trailing commas, `enum`, or `console.log`).
- Handle review comments one by one: implementing → react 👍; not implementing → react 👎 and reply why; questions → answer on the PR. Resolve threads rather than deleting them — the conversation is the record.
- After addressing feedback, re-request review. Reviews are dismissed when new commits land, so expect another pass. Check comments even on approved PRs.

### 6. Done

A change is done when all gates and CI are green, `CHANGELOG.md` has its section, the PR is approved by a code owner and merged by a maintainer, and the issue is closed. Publishing to npm is a separate, maintainer-run step (README → Releasing).

## When a planning doc is required

Write a plan **before any code** when the work spans multiple PRs, changes the node's structure or conventions, or depends on backend endpoints that do not exist yet. Process:

1. Create the plan as `docs/plans/{YYYY-MM-DD}-{feature-slug}.md` (goal, scope, non-goals, step-by-step PR breakdown, backend dependencies, risks, open questions).
2. Open it as its own PR; a maintainer grooms and approves it before implementation starts.
3. Break the work into sub-issues of an umbrella issue (one PR per sub-issue).
4. When implementation deviates from the plan, update the plan in the same PR.

Small single-PR fixes need no planning doc — the issue + PR description is enough.

## Docs maintenance (non-negotiable)

- When a convention changes or a new pattern is established, **update `CONTRIBUTING.md`, the README's Development section, or this file in the same PR**.
- When a mistake pattern repeats across PR reviews, persist the lesson as a rule in the appropriate canonical doc.
- GitHub PR state and review comments are the source of truth — not memory, not summaries.

## Quick reference

| What | Convention |
|---|---|
| Branch | `{issue-number}-{short-kebab-slug}` from `main` (or the parent issue branch); `{type}/{slug}` for issue-less small fixes |
| PR title | Imperative sentence, mirrors the issue for sub-issues |
| PR body | Template: Summary (`Fixes #{issue}`), Behaviour, Test plan, Checklist |
| PR target | `main`; stacked sub-issues → parent issue branch |
| PR gate | All six gates in §3 green + CI green + CHANGELOG section |
| Bot review | `@codex review` |
| Merging | Maintainers only, after a code-owner approval |
| Releases | Maintainers only — README → Releasing; never in a feature PR |
| Planning docs | `docs/plans/{YYYY-MM-DD}-{feature-slug}.md`, own PR, approved before code |
| Coding rulebook | `CONTRIBUTING.md` — no exceptions |
| Review time budget | ~20–40 min; larger → split |
