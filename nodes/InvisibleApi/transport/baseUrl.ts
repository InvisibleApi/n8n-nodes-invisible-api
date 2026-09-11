import type { INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export const DEFAULT_BASE_URL = 'https://api.invisibleapi.ai';

const TRAILING_SLASHES = /\/+$/;

export function normalizeBaseUrl(value: unknown): string {
    const trimmed = String(value ?? '')
        .trim()
        .replace(TRAILING_SLASHES, '');

    return trimmed || DEFAULT_BASE_URL;
}

/**
 * n8n evaluates credential test requests with its own expression engine, which
 * cannot call into this module. Emitting the expression from the same constants
 * keeps it from drifting away from `normalizeBaseUrl` by hand.
 */
export const BASE_URL_TEST_EXPRESSION = `={{ ($credentials.baseUrl || '').trim().replace(/${TRAILING_SLASHES.source}/, '') || '${DEFAULT_BASE_URL}' }}`;

/** The API key travels as a bearer token, so the scheme carrying it matters. */
export function assertSupportedBaseUrl(node: INode, baseUrl: string): void {
    let parsed: URL;
    try {
        parsed = new URL(baseUrl);
    } catch {
        throw new NodeOperationError(node, 'The credential base URL is not a valid URL', {
            description: `Received "${baseUrl}". Provide an absolute URL such as ${DEFAULT_BASE_URL}.`
        });
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new NodeOperationError(node, 'The credential base URL must use http or https', {
            description: `Received the "${parsed.protocol.replace(':', '')}" scheme.`
        });
    }
}
