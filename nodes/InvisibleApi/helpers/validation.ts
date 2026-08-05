import type { INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { toTrimmedString } from './parameters';

/** Length limits the API enforces on its own request DTOs. */
export const API_MAX_LENGTHS = {
	altText: 5000,
	caption: 5000,
	clientRequestId: 128,
	firstComment: 5000,
	metric: 1000,
	sourceUrl: 2048,
} as const;

/** Required fields are enforced by the editor UI, which expressions bypass. */
export function requireValue(node: INode, value: string, label: string, itemIndex: number): string {
	if (value === '') {
		throw new NodeOperationError(node, `${label} is required`, { itemIndex });
	}

	return value;
}

export function assertMaxLength(
	node: INode,
	value: string,
	max: number,
	label: string,
	itemIndex: number,
): void {
	if (value.length > max) {
		throw new NodeOperationError(
			node,
			`${label} is ${value.length} characters long, but the API accepts at most ${max}`,
			{ itemIndex },
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
			description: `Received "${value}". The API expects an absolute http or https URL.`,
		});
	}

	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		throw new NodeOperationError(node, `${label} must be an http or https URL`, {
			itemIndex,
			description: `Received the "${parsed.protocol.replace(':', '')}" scheme, which the API rejects.`,
		});
	}
}

/**
 * The API requires the strict ATOM format, which rejects both the fractional
 * seconds n8n emits through Luxon's `toISO()` and a picker value carrying no
 * offset. A value with no offset is read in the timezone the n8n instance runs
 * in, the same way JavaScript reads it.
 */
export function toAtomTimestamp(
	node: INode,
	value: unknown,
	label: string,
	itemIndex: number,
): string {
	const raw = toTrimmedString(value);
	if (raw === '') {
		return '';
	}

	const parsed = new Date(raw);
	if (Number.isNaN(parsed.getTime())) {
		throw new NodeOperationError(node, `${label} is not a valid date`, {
			itemIndex,
			description: `Received "${raw}". Provide an ISO 8601 timestamp, for example 2026-05-17T10:00:00Z.`,
		});
	}

	return parsed.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}
