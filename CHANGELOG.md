# Changelog

## 0.8.1

Fixes the Organization field that 0.8.0 hid on every Get Many operation, widens lint and formatting to the whole package so the gap that let it through is covered, and adds the GitHub Actions workflow that publishes this version to npm.

- The Organization field is shown again for Social Account → Get Many, Publish Job → Get Many and Organization → Get Limits. Hiding it for Organization → Get Many was written as `hide: { resource, operation }`, and n8n hides a parameter when _any_ listed key matches rather than all of them, so every Get Many operation lost the field and failed with "Could not get parameter organizationId". Caught while running the node in a local n8n; a test now checks the field's visibility for every resource and operation.
- Removed the `overrides` entry from `package.json` — the n8n community-node linter rejects the field, and it only pinned `uuid` for development dependencies that are not part of the published package. The audit finding it cleared is still confined to the `@n8n/node-cli` tooling; CI now runs `npm audit --omit=dev` so a finding that reaches a runtime dependency cannot land silently.
- `npm run lint` now lints the whole package (`eslint .`), matching `n8n-node lint`. The previous file list skipped `package.json`, which is where the linter's package rules run, so CI could not have flagged the `overrides` field. Prettier covers the whole package the same way (`.prettierignore` leaves out `dist`, the lockfile, Markdown and the local `.claude` directory, which Prettier would otherwise reformat because it reads only the repository's `.gitignore`), which reformatted `package.json` to tabs.
- `@n8n/node-cli` and `@n8n/eslint-plugin-community-nodes` are pinned to caret ranges instead of `*`. An unconstrained `npm install` resolved a `@n8n/node-cli` whose dependency tree requires Node 24, against this package's Node 22 engine. `eslint.config.mjs` now registers the pinned `@n8n/eslint-plugin-community-nodes` and its rule set: `@n8n/node-cli` depends on an exact older version and registers that nested copy, so the pin alone left the newer rules unused.
- Added a GitHub Actions publish workflow, based on the n8n-nodes-starter one, that publishes the package to npm with a provenance statement whenever a stable version tag is pushed. n8n requires provenance-signed, GitHub Actions-published packages for community node verification since May 2026. Before building, the workflow checks that the tagged commit is on `main`, that the tag matches the `package.json` version and that `CHANGELOG.md` has a heading for it, then runs the test suite before `n8n-node release` lints, builds and publishes, and finally confirms the version is on npm with its attestation. The job's toolchain is pinned (Node.js 22, an exact npm 11 release, actions by commit SHA), runs one release at a time and times out instead of holding the publish credentials on a stalled runner.
- `npm publish` from a local machine is now blocked by the `prepublishOnly` guard (`n8n-node prerelease`); a `prepack` script builds `dist/` on every pack or publish, and a `release` script runs `n8n-node release`, which the workflow calls. The release process is documented in the README.
- README: the Operations table lists Organization → Get Limits and Publish Job → Cancel, both added in 0.8.0. Corrected the Insights documentation, which still described the 0.7.x field: the weekly-report example asked for `follower_count`, dropped from the metric list in 0.8.0, Metrics is a multi-select rather than a comma-separated string (that is Additional Metrics), and Metric Type already defaults to `total_value`. The Development section now lists every command CI runs.

## 0.8.0

Synced with the InvisibleAPI backend endpoints published since 0.7.1.

- Publish Job → Cancel: cancels a scheduled job before it dispatches to the provider and releases its publishing-limit reservations. Jobs that already dispatched are rejected by the API with a conflict; cancelling an already cancelled job is idempotent.
- Organization → Get Limits: lists the effective paid-plan limit snapshots — configured limit, current usage, active reservations, remaining allowance and reset time per connected account — with an optional feature-key filter. Lets a workflow check the remaining allowance before creating publish jobs.
- Publish Job → Create rejects more than 10 media items up front, matching the cap the API now enforces.
- The Insights metric list now matches the backend's verified catalog. Removed `profile_views` and `website_clicks` (deprecated — Meta rejects them), `replies` (Meta excludes story replies for accounts in Europe, so it always reported 0), and `follower_count`, `online_followers` and `reached_audience_demographics` (never verified against the Instagram Login host). All remain reachable through Additional Metrics, which the API forwards unvalidated.
- The Insights Breakdown option gained the demographic dimensions Meta requires for the demographics metrics (`country`, `city`, `age`, `gender`) and dropped `follower_type`, which the Instagram Login host rejects in favour of `follow_type`.

## 0.7.1

- Publish Job → Get Many with "Return All" no longer stops at the first empty page. The API applies the page limit before dropping rows the key's social-account restrictions don't cover — the same quirk 0.2.1 fixed for short pages — so an empty page can sit in front of populated ones. A key restricted to one social account could get an empty list back while jobs existed, reported as a complete result. Pagination now needs three consecutive empty pages to accept the end of the list; the endpoint returns neither a total count nor a `hasMore` flag, so there is no authoritative signal to use instead.
- Publish Job → Create no longer silently drops media items when the collection is supplied as a single entry rather than a list, which an expression or AI-tool call can do. Neither the "caption or media" check nor the request body saw such a value, so an X post published as text-only while an Instagram post failed at the API. A lone entry is now accepted, and a value that cannot be a media item is rejected by name instead of being read as "no media".
- A resource of `toString`, `constructor` or `valueOf`, reachable through an expression, is now reported as unsupported. The handler lookup read inherited object properties, so those names resolved to a function and crashed with a `TypeError` instead of the intended message.
- Publish Job → Get Many clamps the Page option the way 0.7.0 clamped Limit, and rejects a non-numeric value. The editor enforces a 1-based index, but an expression could send `0` or a string.
- The test suite is now covered by lint, formatting and typechecking, all three wired into CI. It sat outside every check, so nothing could catch a type error in a test file, and three test files had already drifted out of Prettier formatting.
- `dist/package.json`, a stray copy of the manifest, is no longer published. Listing `package.json` in the tsconfig inputs made TypeScript emit it alongside the compiled node.

## 0.7.0

- Added a vitest unit-test suite for the pure helpers — base URL normalisation (including a drift test that evaluates the credential-test expression against `normalizeBaseUrl`), timestamp and input validation, API problem extraction, media type inference, and the pagination loop with its dedup and page-cap behaviour. CI runs it between lint and build.
- A date-only Requested Publish At (`2026-05-17`, reachable only through an expression, since the picker always emits a time) is now read as midnight in the n8n instance's timezone, like a datetime without an offset. JavaScript reads bare dates as UTC midnight, which scheduled the post hours off for any instance not running in UTC.
- Publish Job → Get Many clamps Limit to the API's 1–100 page size and rejects non-numeric values. The editor already enforces the range, but an expression could send anything.
- A Media Type outside auto/image/video — again only possible through an expression — is rejected with a clear message instead of being forwarded for the API to bounce.
- Pagination dedup now recognises numeric IDs as well as strings, so duplicate-page protection would survive an ID type change in the API.
- The Get Many Page option now documents that a job whose deliveries straddle a page boundary can appear on two consecutive pages.
- `inferMediaTypeFromUrl` requires a valid absolute URL instead of carrying an unreachable fallback; its only caller validates the URL first.

## 0.6.0

- Publish Job → Create media items are down to a Media URL and Alt Text, matching what the InvisibleAPI dashboard actually collects.
- Media Type is detected from the file extension in the Media URL, using the same rule as the dashboard. It stays available as an explicit Image or Video override, because detection is extension-based and a URL without one — a signed CDN link, say — would otherwise fall back to image and publish a video as a still.
- Source URL and Public Fetch URL became a single Media URL field, sent as both. The API requires `sourceUrl` and treats `publicFetchUrl` as an override; the dashboard submits its one collected URL as both, and the node now does the same. The field kept its internal name, so an existing workflow's URL carries over. A workflow that deliberately set a Public Fetch URL different from its Source URL will now send the source URL for both.
- Removed Metadata and Source Asset ID. Neither is reachable in the dashboard — both are hardcoded to null there — and a value set in an existing workflow is no longer sent.

## 0.5.0

- Social Account → Providers is now a multi-select of Instagram and X instead of a free-text field, so the filter can no longer be defeated by a typo. Selecting several providers keeps accounts matching any of them; leaving it empty still returns all. The endpoint accepts no provider parameter and the node filters the returned list itself, so matching more than one provider costs nothing. Workflows that saved a single provider string keep working unchanged.
- Facebook is deliberately absent from the list: it exists in the API's provider enum, but the social accounts endpoint returns only Instagram and X targets, so offering it would be a filter that always matches nothing.

## 0.4.1

- Base URL normalisation now has a single source. The rule was written twice — once in TypeScript for node execution and once as an n8n expression for the credential test — and the two had already drifted: a base URL of `///` resolved to the production default in the credential test but to an empty string during execution, sending every request to a relative path. The credential test expression is now generated from the same constants the normaliser uses.
- The credential base URL is rejected unless it is a valid http or https URL, instead of being pasted into the request as-is. The field also now states that http sends the API key in cleartext, since the key travels as a bearer token.
- Removed the unused `qs` and `perPage` parameters from `invisibleApiRequestAllItems`; no caller ever passed either.
- Pinned the transitive `uuid` dependency to `^11.1.1` through an override, clearing GHSA-w5hq-g745-h8pq. `npm audit fix` could not resolve it on its own: `@langchain/classic` and `@langchain/community` both request `^10.0.0`, and the fix lands outside that range. Development dependency only — nothing here ships in the published package.

## 0.4.0

- Publish Job → Create no longer fails with an opaque 400 when scheduling. The API validates `requestedPublishAt` against the strict ATOM format, which rejects both the fractional seconds n8n emits through Luxon's `toISO()` and a picker value with no UTC offset. The node now normalises the value to UTC ATOM before sending, and reports an unparseable date as a node error naming the item. An epoch number, which the API never accepted, is now rejected by the node instead of being forwarded.
- API validation and conflict failures now report which field was rejected. The API returns a per-field `errors` map and a matching `errorMeta` map of stable keys; both were being discarded in favour of the bare status, so "Scheduled publishing time must be in the future." reached the user as an unexplained 409. The field messages become the node error message and the error keys its description.
- Publish Job → Get Many with "Return All" no longer emits the same publish job twice. The list query joins each job's deliveries and applies the page limit to the joined rows, so a job with several deliveries can straddle a page boundary and be returned on both pages. Pages are now accumulated by job ID.
- Publish Job and Social Account URL-encode the organization and publish job IDs. Previously a `#` in a publish job ID truncated the path, silently turning Retry into Get and reporting success without retrying anything.
- Caption, first comment, client request ID, alt text, source asset ID, source URL and public fetch URL are checked against the API's length limits before the request, and the two URL fields against the http/https scheme the API requires, so a violation names the field and the input item instead of failing the whole request with a 400.
- Media item metadata that parses to a JSON array or scalar is rejected with a clear message. The API's type check accepts both, so such a value was previously stored as unusable metadata.
- Empty required values reaching the node through an expression or an AI-tool call are rejected by name, instead of building a malformed path such as `/api/v1/organizations//social-accounts` and surfacing as a 404.
- Text parameters resolved to a non-string by an expression no longer crash the node with a `TypeError`, and "Continue On Fail" now also catches a resource or operation that fails to resolve.
- Alt text is trimmed like every other text field, and a caption consisting only of whitespace is no longer sent.

## 0.3.0

- Insight → Social Account now lists only Instagram professional accounts. Insights capability is resolved per provider and target type by the API, so X accounts could only ever be picked to produce a conflict error.
- Insight → Metric became a multi-select of the documented Meta account metrics, replacing free text. Values saved as a comma-separated string by earlier versions still execute unchanged.
- Insight → Additional Metrics: new optional field for metric names that are not in the multi-select. The API forwards metric names to Meta without validating them, so a metric Meta adds is reachable without waiting for a node release.
- Insight → Period became a dropdown of `day`, `week`, `days_28` and `lifetime` instead of free text.
- Insight → Get Instagram Account Insights rejects an empty Period with a node error, matching the existing empty-Metric check, and URL-encodes the organization and social account IDs so an ID carrying `?`, `#` or `..` can no longer rewrite the request path.

## 0.2.2

- Publish Job → Get Many with "Return All" now fails with a clear error when pagination hits the 1000-page safety cap without reaching the end of the list, instead of silently returning partial data as if it were complete.
- Invalid JSON in a media item's Metadata field is now reported as a node input error carrying the failing item's index, instead of surfacing as an API error.
- Insight → Get Instagram Account Insights rejects an empty Metric with "At least one metric is required" instead of sending the request and failing with an opaque upstream error. The check also covers values set via expressions or AI-tool usage, which bypass the UI's required-field validation.

## 0.2.1

- Publish Job → Get Many with "Return All" no longer stops on a partially filled page — the API filters out jobs the key's social-account restrictions don't cover after applying the page limit, so a short page isn't necessarily the last one. Pagination now walks until an empty page.
- The credential test now handles a base URL with a trailing slash (or a blank one) the same way node execution does, instead of failing on `//api/v1/...`.
- Publish Job → Create omits `caption` from the request body when it is empty (media-only posts), consistent with every other optional field.
- Fixed the package `main` entry, which pointed at a nonexistent `index.js`.
- Insight → Breakdown is now a dropdown with the four values the API accepts (`media_product_type`, `follow_type`, `follower_type`, `contact_button_type`) instead of free text.

## 0.2.0

- Publish Job → Retry: new operation that queues the eligible failed deliveries of a publish job for a safe retry.
- Publish Job → Create: media items are now optional, matching the API — X targets accept text-only posts, while Instagram still requires at least one media item (enforced by the API). The node only rejects posts with neither a caption nor media.
- Documented X publishing constraints in the field descriptions and README: 280-character post text limit, and multi-media posts of up to 4 images (no videos).
- Social Account provider filter documents the supported providers (instagram, x).

## 0.1.0

- Initial release.
- Credential: InvisibleAPI organization API key, sent as `Authorization: Bearer <api-key>`, with a configurable base URL.
- Resources: Organization (get many), Social Account (get many, provider filter), Publish Job (create, get, get many with Return All), Insight (Instagram account insights).
- Dynamic dropdowns for organizations and publish targets.
