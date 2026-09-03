# n8n-nodes-invisible-api

[![npm version](https://img.shields.io/npm/v/n8n-nodes-invisible-api.svg)](https://www.npmjs.com/package/n8n-nodes-invisible-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![n8n community node](https://img.shields.io/badge/n8n-community--node-orange)](https://www.npmjs.com/package/n8n-nodes-invisible-api)

> One node between your n8n workflows and the social platforms behind them — publish and schedule Instagram and X content, track delivery, and pull Instagram account insights.

[InvisibleAPI](https://invisibleapi.ai) is a single layer over the social platforms. Today it covers Instagram and X publishing plus Instagram account insights; Google and Facebook publishing, broader insights and further platforms are on the way — this node grows with the API.

## Install

On self-hosted n8n: **Settings → Community nodes → Install**, then enter:

```
n8n-nodes-invisible-api
```

Full instructions: [n8n community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

## What you can build

**Publish a content calendar, and know whether it landed**

```text
⏱  Schedule Trigger (daily, 9am)
  ↓
📄 Google Sheets: read today's row (caption + image URL)
  ↓
📤 InvisibleAPI: Publish Job → Create (Instagram + X targets)
  ↓
⏳ Wait (2 min)
  ↓
🔎 InvisibleAPI: Publish Job → Get (the returned id)
  ↓
🔀 IF status = failed  →  💬 Slack: alert the team
```

**Cross-post every new blog article**

```text
📰 RSS Feed Trigger (your blog)
  ↓
🤖 AI node: write a 280-character version of the title + summary
  ↓
📤 InvisibleAPI: Publish Job → Create (X target, text-only)
```

**Weekly Instagram performance report**

```text
⏱  Schedule Trigger (Mondays)
  ↓
👥 InvisibleAPI: Social Account → Get Many (provider = Instagram)
  ↓
📈 InvisibleAPI: Insight → Get Instagram Account Insights
     (metrics: reach, total_interactions · period: week)
  ↓
📄 Google Sheets: append row   →   💬 Slack: post the summary
```

## Operations

| Resource | Operation | What it does |
|---|---|---|
| Organization | Get Many | List the organizations the API key can reach |
| Organization | Get Limits | List the effective paid-plan limits per connected account — configured limit, usage, reservations, remaining allowance and reset time — with an optional feature-key filter |
| Social Account | Get Many | List connected accounts usable as publish targets, optionally filtered by provider |
| Publish Job | Create | Start a publish job for one or more connected accounts, immediately or scheduled |
| Publish Job | Get | Retrieve a single publish job with its delivery records |
| Publish Job | Get Many | Retrieve an organization's publish jobs, with paging or **Return All** |
| Publish Job | Retry | Queue a job's failed deliveries for a safe retry — deliveries that already reached the provider are rejected, so nothing gets posted twice |
| Publish Job | Cancel | Cancel a scheduled job before it dispatches to the provider and release its publishing-limit reservations |
| Insight | Get Instagram Account Insights | Fetch Meta account-level insights for a connected Instagram account |

## Credentials

Create an organization API key in the [InvisibleAPI dashboard](https://app.invisibleapi.ai) (**Organization → API Keys**) and paste it into the *InvisibleAPI* credential.

| | |
|---|---|
| **Auth** | Sent as `Authorization: Bearer <api-key>` |
| **Scopes** | Reading needs `publishing:read`, creating publish jobs needs `publishing:publish`; `*` covers both |
| **Organization** | A key belongs to exactly one organization, so the dropdown normally shows a single entry |
| **Base URL** | Defaults to `https://api.invisibleapi.ai`; only change it for a staging or self-hosted backend |

## Things to know

Behaviour that will bite you otherwise:

- **The job status you get back is not final.** Create returns as soon as the workflow start is recorded. To wait for delivery, follow up with **Publish Job → Get** on the returned `id` (a Wait node in between works well) and read `status` plus `deliveries`.
- **What a post may contain depends on the target.** Instagram requires at least one media item — image, video, or several for a carousel. X also accepts text-only posts, caps text at 280 characters, and allows either up to 4 images (no videos) or a single video. Content a provider can't publish is rejected with a validation error before any delivery starts.
- **`Client Request ID` is an idempotency key.** Reuse the same value when retrying a failed run; send a new value when you deliberately want to publish identical content again.
- **Retry is deliberately conservative.** It only requeues deliveries it can prove never reached the provider, and answers with a conflict error when nothing about the job is safely retryable.
- **Some Meta metrics need `total_value`.** `accounts_engaged`, `total_interactions`, `likes` and friends are silently omitted from time-series responses. **Metric Type** defaults to `total_value` for that reason — switching it to `time_series` drops them with no error.
- **Demographics metrics need `Timeframe`.** `follower_demographics` and `engaged_audience_demographics` require it, and Meta gives it precedence over **Since** and **Until**.

**Metrics** is a multi-select of the metrics the backend has verified. **Additional Metrics** takes a comma-separated list for anything outside it, forwarded to Meta unvalidated. **Period** is a Meta period: `day`, `week`, `days_28` or `lifetime`.

## Compatibility

Requires n8n with community node support and Node.js 22 or newer.

## Development

```bash
npm install
npm run lint       # eslint over the whole package, package.json included
npm run format     # prettier over the whole package
npm run typecheck
npm test
npm run build
npm run dev        # runs the node against a local n8n
```

The node is organised so new providers and features slot in without touching what exists:

```text
nodes/InvisibleApi/
  InvisibleApi.node.ts       # description assembly + one entry per resource in RESOURCE_HANDLERS
  descriptions/              # UI parameters, one module per resource
  actions/                   # request building, one module per resource
  methods/loadOptions.ts     # dynamic dropdowns
  transport/                 # auth, base URL and pagination
```

Adding a resource means: a description module, an action module, and one line in `RESOURCE_HANDLERS`.

## Releasing

Releases are published to npm by the [Publish workflow](https://github.com/InvisibleApi/n8n-nodes-invisible-api/blob/main/.github/workflows/publish.yml), never from a local machine. The workflow runs `n8n-node release`, which lints, builds and publishes with an [npm provenance statement](https://docs.npmjs.com/generating-provenance-statements) — a requirement for [verified community nodes](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/) since May 2026. A plain `npm publish` is blocked by the `prepublishOnly` guard.

To cut a release:

1. Bump the version in both `package.json` and `package-lock.json`:

   ```bash
   npm version 0.9.0 --no-git-tag-version
   ```

2. In `CHANGELOG.md`, rename the `## Unreleased` heading to `## 0.9.0` (or add the heading if the release has no Unreleased section yet).
3. Merge those changes to `main`.
4. Tag the merge commit with the bare version and push the tag:

   ```bash
   git tag 0.9.0
   git push origin 0.9.0
   ```

The workflow refuses to publish, before anything is built, if the tagged commit is not on `main`, the tag is not a stable `X.Y.Z` version, the tag does not match the `package.json` version, or `CHANGELOG.md` has no heading for that version. It also verifies afterwards that the version is on npm with a provenance attestation. The one-time npm setup (a Trusted Publisher for GitHub Actions, or an `NPM_TOKEN` secret for the first release) is described in the comments at the top of the workflow file.

`n8n-node release` can also drive steps 1–4 locally, but it regenerates `CHANGELOG.md` from commit messages with `auto-changelog`, which would overwrite the hand-written changelog. Bump and tag by hand instead.

## Resources

| | |
|---|---|
| 🌐 Website | [invisibleapi.ai](https://invisibleapi.ai) |
| 🔑 Dashboard | [app.invisibleapi.ai](https://app.invisibleapi.ai) |
| 🔌 API endpoint | `https://api.invisibleapi.ai` |
| 📦 npm | [n8n-nodes-invisible-api](https://www.npmjs.com/package/n8n-nodes-invisible-api) |
| 💻 GitHub | [InvisibleApi/n8n-nodes-invisible-api](https://github.com/InvisibleApi/n8n-nodes-invisible-api) |
| 📖 API reference | [developer-docs.yaml](https://api.invisibleapi.ai/public/developer-docs.yaml) |
| 📝 Changelog | [CHANGELOG.md](https://github.com/InvisibleApi/n8n-nodes-invisible-api/blob/main/CHANGELOG.md) |
| 🧩 n8n docs | [Community nodes](https://docs.n8n.io/integrations/#community-nodes) |

## License

[MIT](https://github.com/InvisibleApi/n8n-nodes-invisible-api/blob/main/LICENSE.md)
