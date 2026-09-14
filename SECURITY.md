# Security Policy

## Reporting a vulnerability

Email **support@invisibleapi.ai** with `SECURITY` in the subject. Please do not
open a public issue for a vulnerability — an issue is visible to everyone the
moment you file it.

Include whatever you have: what you did, what happened, the version of this node
(`n8n-nodes-invisibleapi`) and of n8n, and anything that helps us reproduce it.
A proof of concept is welcome but not required.

We will acknowledge your report and tell you whether we can reproduce it. If we
ship a fix we will credit you in `CHANGELOG.md` unless you would rather we did
not.

## Supported versions

Only the latest published version receives fixes. Older versions are not
patched — upgrade to the current release, which n8n offers under **Settings →
Community nodes**.

## What belongs here

This repository is the n8n community node: the credential definition, the
request building, and the transport layer. Report it here if it concerns:

- how the credential stores or transmits the organization API key
- the key, or other credential data, appearing in logs, error messages or node
  output
- a request being sent somewhere other than the configured base URL
- dependency or supply-chain issues in the published package

For a vulnerability in the **InvisibleAPI service itself** — the API at
`api.invisibleapi.ai`, the dashboard, or how the backend handles your social
accounts — use the same address, and say that it is about the service. It
reaches the right people either way.

## Handling your API key

Two things about this node are worth knowing when you assess a report:

- The API key travels as `Authorization: Bearer <api-key>`. Over an `http` base
  URL it crosses the network in cleartext, which is why the credential warns
  about it and rejects anything that is not a valid `http` or `https` URL.
- n8n owns credential storage and encryption. This node asks n8n for the
  credential at request time and never writes it anywhere.
