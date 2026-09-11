# Contributing

Thanks for looking. This is the n8n community node for
[InvisibleAPI](https://invisibleapi.ai) — bug reports, fixes and new operations
are all welcome.

## Before you write code

**Open an issue first** for anything beyond a small fix. The node's shape
follows the InvisibleAPI backend, so a new resource or operation usually depends
on an endpoint existing and being stable. A short issue saves you writing
against something that is about to change.

Small and obviously-right changes — a typo, a wrong description, a broken link —
can go straight to a pull request.

## Getting set up

`npm install`, then the commands in the
[Development section of the README](README.md#development). The same checks CI
runs are listed there; run them locally before you push:

```bash
npm run lint
npx prettier --check .
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

`npm run dev` runs the node against a local n8n, which is the only way to see
how a parameter actually behaves in the UI.

## How the node is organised

Adding a resource means a description module, an action module, and one line in
`RESOURCE_HANDLERS`. The
[layout is sketched in the README](README.md#development) — follow it rather
than adding a new pattern, and put request building in `actions/` and UI
parameters in `descriptions/`.

## Coding standards

TypeScript throughout, `strict` mode on. Formatting is enforced by Prettier
(`npm run format`); the rules below that tooling cannot check are on you and on
review.

### Formatting

- 4-space indentation (spaces, not tabs); lines up to 120 characters.
- Single quotes; semicolons always; **no trailing commas** — objects, arrays
  and argument lists alike.
- LF line endings and a trailing newline at end of file.

### TypeScript

- **Explicit return types** on exported functions and shared helpers
  (`: void`, `: Promise<IDataObject[]>`, …). Single-expression inline arrows
  may rely on inference. This is not linted — it is on you.
- **No `enum`** — use const maps or union types instead.
- No `any`; use `unknown` when the shape is truly unknown and narrow it with
  type guards.
- Prefer `interface` over `type` for extendable object shapes; `type` is fine
  for unions and function signatures.
- Reach for the utility types (`Partial`, `Pick`, `Omit`, `Required`) before
  writing a near-duplicate shape, and for `?.` / `??` before manual null
  checks.

### Naming

- Utility modules `camelCase.ts`; constants `UPPER_SNAKE_CASE`.
- Booleans `isX` / `hasX`; event handlers `handleX`; fetchers `fetchX`;
  toggles `toggleX`.
- Prefer named exports.

### Errors and logging

- **No `console.log` / `console.error`** in shipped code — errors surface
  through `NodeOperationError` / `NodeApiError`.
- `try`/`catch` only around operations that can actually fail in a way you
  handle; validate input up front instead of catching what bad input causes.
- JSDoc for non-obvious functions; `TODO` comments carry an issue reference.

## Pull requests

- **Branch off `main`** and open the PR against `main`. `main` is protected; it
  takes a review and passing CI.
- **One concern per PR.** A bug fix and a new operation are two pull requests.
- **Tests.** The helpers under `nodes/InvisibleApi/helpers/` and `transport/`
  are unit-tested in `tests/` — a change there needs a test.
- **CHANGELOG.md.** Add a new `##` section at the top for your batch of work,
  and describe what changed and why it mattered. Do not append to the section
  above yours, even if it is unreleased.
- **Comments** explain why something is not obvious. Do not restate what the
  code says.
- **Do not bump the version** in a feature PR, and do not push tags. Releases
  are cut separately, as described in
  [Releasing](README.md#releasing).

## Review and merge

A pull request needs one approving review from a
[code owner](.github/CODEOWNERS) and green CI before it can merge. Reviews are
dismissed when new commits land, so expect another pass if you push after an
approval. Resolve review threads rather than deleting them — the conversation is
the record of why the code looks the way it does.

Maintainers merge. If your PR has been sitting with an approval, say so on the
thread rather than assuming it was missed.

## Reporting bugs

Open an issue with the version of this node and of n8n, the operation you ran,
what you expected, and what happened. If the API returned an error, include it —
the node surfaces the API's problem detail, and that message is usually the whole
answer.

For anything security-related, do not open an issue. Follow
[SECURITY.md](SECURITY.md) instead.

## Licence

The project is MIT-licensed. Contributions are accepted under the same licence.
