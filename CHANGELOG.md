# Changelog

## 1.0.0

First public release of the n8n community node for [InvisibleAPI](https://invisibleapi.ai).

**Credential**

- InvisibleAPI organization API key, sent as `Authorization: Bearer <api-key>`, with a configurable base URL that defaults to `https://api.invisibleapi.ai`. The base URL must be a valid http or https URL; http is accepted for local and self-hosted backends, and the field says that it sends the key in cleartext. The credential test and node execution normalise the base URL through one shared rule.

**Operations**

- Organization → Get Many lists the organizations the key can reach. Organization → Get Limits lists the effective paid-plan limits per connected account — configured limit, current usage, active reservations, remaining allowance and reset time — with an optional feature-key filter.
- Social Account → Get Many lists the connected accounts usable as publish targets, with a multi-select provider filter for Instagram and X. Facebook is deliberately absent: the API's provider enum has it, but the endpoint returns only Instagram and X targets.
- Publish Job → Create starts a publish job for one or more connected accounts, immediately or scheduled. Media items are a Media URL and Alt Text, with the media type detected from the URL's extension and an explicit Image or Video override for URLs without one. Instagram requires at least one media item; X also accepts text-only posts. Up to 10 media items per job, matching the API's cap. A Client Request ID acts as an idempotency key.
- Publish Job → Get returns a single job with its delivery records. Publish Job → Get Many pages through an organization's jobs, with Return All accumulating pages by job ID so a job whose deliveries straddle a page boundary is not emitted twice.
- Publish Job → Retry requeues only the failed deliveries that provably never reached the provider; the API answers with a conflict when nothing is safely retryable. Publish Job → Cancel cancels a scheduled job before it dispatches and releases its publishing-limit reservations.
- Insight → Get Instagram Account Insights fetches Meta account-level insights for a connected Instagram professional account. Metrics is a multi-select of the metrics the backend has verified, Additional Metrics takes a comma-separated list forwarded to Meta unvalidated, and Period, Breakdown, Metric Type and Timeframe are dropdowns of the values Meta accepts.
- Dynamic dropdowns for organizations and publish targets.

**Input handling**

- Requested Publish At is normalised to UTC ATOM before sending, since the API validates it strictly and rejects both the fractional seconds n8n emits and a picker value without a UTC offset. A date-only value is read as midnight in the n8n instance's timezone. An unparseable date or an epoch number is rejected by name.
- Text fields are checked against the API's length limits, URL fields against the http/https scheme, and Limit and Page against the API's ranges, so a violation names the field and the input item instead of failing the request with a bare 400.
- Values reaching the node through an expression or an AI-tool call are coerced and validated first: a wrong-typed or empty required value, a lone media item supplied outside a list, or a resource name that resolves to an inherited object property is reported clearly instead of crashing or building a malformed path.
- Organization, publish job and social account IDs are URL-encoded, so an ID carrying `?`, `#` or `..` cannot rewrite the request path.

**Errors**

- API validation and conflict failures report which field was rejected. The API's per-field `errors` map becomes the node error message and its `errorMeta` keys the description, so "Scheduled publishing time must be in the future." reaches the user as written instead of as an unexplained 409.
- Return All fails with a clear error when pagination hits the 1000-page safety cap without reaching the end of the list. Because the API applies the page limit before dropping rows the key's social-account restrictions do not cover, a short or empty page is not taken as the end; pagination needs three consecutive empty pages.

**Tooling**

- Unit-test suite with vitest for base URL normalisation, timestamp and input validation, API problem extraction, media type inference, pagination and parameter visibility. CI runs lint, formatting, typecheck, tests, build and `npm audit --omit=dev`.
- Releases are published to npm by a GitHub Actions workflow with an npm provenance statement, as n8n requires for verified community nodes. The workflow refuses to publish a tag that is not on `main`, does not match the `package.json` version or has no heading in this file. Local `npm publish` is blocked.
