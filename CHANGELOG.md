# Changelog

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
