import type { IDataObject, INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { toTrimmedString } from './parameters';

/** The API rejects publish jobs carrying more media items than this. */
export const API_MAX_MEDIA_ITEMS = 10;

/** Length limits the API enforces on its own request DTOs. */
export const API_MAX_LENGTHS = {
    altText: 5000,
    caption: 5000,
    clientRequestId: 128,
    firstComment: 5000,
    metric: 1000,
    sourceUrl: 2048
} as const;

/** Required fields are enforced by the editor UI, which expressions bypass. */
export function requireValue(node: INode, value: string, label: string, itemIndex: number): string {
    if (value === '') {
        throw new NodeOperationError(node, `${label} is required`, { itemIndex });
    }

    return value;
}

/**
 * Numeric ranges are enforced by the editor, which expressions bypass. Out-of-
 * range values are clamped rather than rejected, since the intent — the largest
 * page the API allows, the first page — is unambiguous.
 */
export function toBoundedInteger(
    node: INode,
    value: unknown,
    label: string,
    itemIndex: number,
    min: number,
    max: number = Number.MAX_SAFE_INTEGER
): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new NodeOperationError(node, `${label} must be a number`, { itemIndex });
    }

    return Math.min(Math.max(Math.trunc(parsed), min), max);
}

/**
 * A `fixedCollection` resolves to an array of entries in the editor, but an
 * expression or AI-tool call can supply a lone entry or a scalar. A lone entry
 * is wrapped, because the intent is clear; anything else is rejected by name,
 * because reading it as "no entries" would drop media from the post and publish
 * it anyway.
 */
export function toCollectionEntries(node: INode, value: unknown, label: string, itemIndex: number): IDataObject[] {
    if (value === undefined || value === null || value === '') {
        return [];
    }

    const entries = Array.isArray(value) ? value : [value];

    return entries.map((entry, entryIndex) => {
        if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
            throw new NodeOperationError(node, `${label} entry ${entryIndex + 1} is not a set of fields`, {
                itemIndex,
                description: `Received the ${Array.isArray(entry) ? 'array' : typeof entry} ${JSON.stringify(entry)}. Provide one object of fields per entry.`
            });
        }

        return entry as IDataObject;
    });
}

export function assertMaxLength(node: INode, value: string, max: number, label: string, itemIndex: number): void {
    if (value.length > max) {
        throw new NodeOperationError(
            node,
            `${label} is ${value.length} characters long, but the API accepts at most ${max}`,
            { itemIndex }
        );
    }
}

/** The API validates media URLs with Symfony's Url constraint: http and https only. */
export function assertHttpUrl(node: INode, value: string, label: string, itemIndex: number): void {
    let parsed: URL;
    try {
        parsed = new URL(value);
    } catch {
        throw new NodeOperationError(node, `${label} is not a valid URL`, {
            itemIndex,
            description: `Received "${value}". The API expects an absolute http or https URL.`
        });
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new NodeOperationError(node, `${label} must be an http or https URL`, {
            itemIndex,
            description: `Received the "${parsed.protocol.replace(':', '')}" scheme, which the API rejects.`
        });
    }
}

/**
 * The API requires the strict ATOM format, which rejects both the fractional
 * seconds n8n emits through Luxon's `toISO()` and a picker value carrying no
 * offset. A value with no offset is read in the timezone the n8n instance runs
 * in — including date-only values, which are extended to local midnight because
 * JavaScript would otherwise read them as UTC midnight.
 */
export function toAtomTimestamp(node: INode, value: unknown, label: string, itemIndex: number): string {
    const raw = toTrimmedString(value);
    if (raw === '') {
        return '';
    }

    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00` : raw;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
        throw new NodeOperationError(node, `${label} is not a valid date`, {
            itemIndex,
            description: `Received "${raw}". Provide an ISO 8601 timestamp, for example 2026-05-17T10:00:00Z.`
        });
    }

    return parsed.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}
