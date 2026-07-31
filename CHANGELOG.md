# Changelog

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
- Credential: Invisible API organization API key, sent as `Authorization: Bearer <api-key>`, with a configurable base URL.
- Resources: Organization (get many), Social Account (get many, provider filter), Publish Job (create, get, get many with Return All), Insight (Instagram account insights).
- Dynamic dropdowns for organizations and publish targets.
