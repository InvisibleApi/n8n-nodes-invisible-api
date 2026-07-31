# n8n-nodes-invisible-api

This is an n8n community node. It lets you use the [Invisible API](https://api.invisibleapi.ai) in your n8n workflows.

Invisible API is a single layer between your workflows and the social platforms behind it. Today it covers Instagram and X publishing plus Instagram account insights; Google and Facebook publishing, broader insights and further social platform integrations are on the way — this node grows with the API.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Usage](#usage)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In short, on self-hosted n8n: **Settings → Community nodes → Install**, then enter `n8n-nodes-invisible-api`.

## Operations

### Organization

- **Get Many** — list the organizations the API key can reach

### Social Account

- **Get Many** — list the connected accounts usable as publish targets, optionally filtered by provider

### Publish Job

- **Create** — start a publish job for one or more connected accounts, immediately or scheduled
- **Get** — retrieve a single publish job with its delivery records
- **Get Many** — retrieve an organization's publish jobs, with paging or **Return All**
- **Retry** — queue the failed deliveries of a publish job for a safe retry; deliveries that already reached the provider are rejected to avoid duplicate posts

### Insight

- **Get Instagram Account Insights** — fetch Meta account-level insights for a connected Instagram account

## Credentials

Create an organization API key in the Invisible API dashboard (**Organization → API Keys**) and paste it into the *Invisible API* credential.

Notes:

- An API key belongs to exactly one organization, so the **Organization** dropdown normally shows a single entry.
- Keys are scoped. Reading needs `publishing:read`, creating publish jobs needs `publishing:publish`; `*` covers both.
- The key is sent as `Authorization: Bearer <api-key>`.
- **Base URL** defaults to `https://api.invisibleapi.ai` and only needs changing for a staging or self-hosted backend.

## Usage

### Publishing a post

1. Add an **Invisible API** node, resource **Publish Job**, operation **Create**.
2. Pick the **Organization**, then pick one or more **Targets** — the dropdown lists connected Instagram and X accounts and is refreshed from the API.
3. Write a **Caption** and/or add **Media Items** (media type plus a source URL). What a post may contain depends on the targets:
   - **Instagram** requires at least one media item — image, video, or several items for a carousel.
   - **X** also accepts text-only posts, and limits post text to 280 characters. An X post with several media items supports up to 4 images (no videos); a single image or a single video is fine.
4. Optionally set **Requested Publish At** to schedule instead of publishing right away.
5. Optionally set **Client Request ID**. It is an idempotency key: reuse the same value when retrying a failed run, and send a new value when you deliberately want to publish identical content again.

Content that a target provider cannot publish (for example an Instagram target with no media, or five images on an X target) is rejected by the API with a validation error before any delivery starts.

The node returns the publish job right after the workflow start is recorded — status is not final yet. To wait for delivery, follow up with **Publish Job → Get** on the returned `id` (a Wait node in between works well) and read `status` plus `deliveries`.

If a job ends up failed, **Publish Job → Retry** queues its eligible failed deliveries again. The API only retries deliveries it can prove never reached the provider, and answers with a conflict error when nothing about the job is safely retryable.

### Reading insights

Resource **Insight** → **Get Instagram Account Insights**. **Metric** takes one metric or a comma-separated list, and **Period** is a Meta period such as `day`, `week`, `days_28` or `lifetime`.

Two Meta quirks worth knowing:

- Several metrics (`accounts_engaged`, `total_interactions`, `likes`, …) are only returned when **Metric Type** is `total_value`; Meta silently omits them from time-series responses.
- Demographics metrics (`follower_demographics`, `engaged_audience_demographics`) require **Timeframe**, which Meta gives precedence over **Since** and **Until**.

## Compatibility

Requires n8n with community node support and Node.js 22 or newer.

## Development

```bash
npm install
npm run lint
npm run build
npm run dev      # runs the node against a local n8n
```

The node is organised so new providers and features slot in without touching what exists:

```text
nodes/InvisibleApi/
  InvisibleApi.node.ts       # description assembly + one entry per resource in RESOURCE_HANDLERS
  descriptions/              # UI parameters, one module per resource
  actions/                   # request building, one module per resource
  methods/loadOptions.ts     # dynamic dropdowns
  transport/index.ts         # auth, base URL and pagination
```

Adding a resource means: a description module, an action module, and one line in `RESOURCE_HANDLERS`.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Invisible API developer reference](https://api.invisibleapi.ai/public/developer-docs.yaml)

## License

[MIT](https://github.com/embedsocial/n8n-nodes-invisible-api/blob/main/LICENSE.md)
