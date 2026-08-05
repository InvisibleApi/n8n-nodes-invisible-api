import { NodeOperationError } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';

import {
	assertHttpUrl,
	assertMaxLength,
	requireValue,
	toAtomTimestamp,
} from '../nodes/InvisibleApi/helpers/validation';
import { testNode } from './fixtures';

describe('requireValue', () => {
	it('returns a non-empty value unchanged', () => {
		expect(requireValue(testNode, 'abc', 'Field', 0)).toBe('abc');
	});

	it('throws for the empty string', () => {
		expect(() => requireValue(testNode, '', 'Field', 0)).toThrow(NodeOperationError);
	});
});

describe('assertMaxLength', () => {
	it('accepts a value at the limit', () => {
		expect(() => assertMaxLength(testNode, 'aaa', 3, 'Field', 0)).not.toThrow();
	});

	it('rejects a value over the limit', () => {
		expect(() => assertMaxLength(testNode, 'aaaa', 3, 'Field', 0)).toThrow(
			/4 characters long, but the API accepts at most 3/,
		);
	});
});

describe('assertHttpUrl', () => {
	it('accepts http and https URLs', () => {
		expect(() => assertHttpUrl(testNode, 'https://example.com/a.jpg', 'Field', 0)).not.toThrow();
		expect(() => assertHttpUrl(testNode, 'http://example.com/a.jpg', 'Field', 0)).not.toThrow();
	});

	it('rejects other schemes', () => {
		expect(() => assertHttpUrl(testNode, 'ftp://example.com/a.jpg', 'Field', 0)).toThrow(
			NodeOperationError,
		);
	});

	it('rejects values that are not URLs', () => {
		expect(() => assertHttpUrl(testNode, 'not a url', 'Field', 0)).toThrow(NodeOperationError);
	});
});

describe('toAtomTimestamp', () => {
	it('returns the empty string for empty input', () => {
		expect(toAtomTimestamp(testNode, '', 'Field', 0)).toBe('');
		expect(toAtomTimestamp(testNode, undefined, 'Field', 0)).toBe('');
	});

	it('strips fractional seconds and emits an ATOM offset', () => {
		expect(toAtomTimestamp(testNode, '2026-05-17T10:00:00.123Z', 'Field', 0)).toBe(
			'2026-05-17T10:00:00+00:00',
		);
	});

	it('respects an explicit offset', () => {
		expect(toAtomTimestamp(testNode, '2026-05-17T12:00:00+02:00', 'Field', 0)).toBe(
			'2026-05-17T10:00:00+00:00',
		);
	});

	it('reads a date-only value as local midnight, like a datetime with no offset', () => {
		expect(toAtomTimestamp(testNode, '2026-05-17', 'Field', 0)).toBe(
			toAtomTimestamp(testNode, '2026-05-17T00:00:00', 'Field', 0),
		);
	});

	it('rejects values that are not dates', () => {
		expect(() => toAtomTimestamp(testNode, 'tomorrow-ish', 'Field', 0)).toThrow(
			NodeOperationError,
		);
	});
});
