import { NodeOperationError } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';

import {
    assertHttpUrl,
    assertMaxLength,
    requireValue,
    toAtomTimestamp,
    toBoundedInteger,
    toCollectionEntries
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
            /4 characters long, but the API accepts at most 3/
        );
    });
});

describe('toBoundedInteger', () => {
    it('keeps an in-range value', () => {
        expect(toBoundedInteger(testNode, 50, 'Limit', 0, 1, 100)).toBe(50);
    });

    it('clamps to the range', () => {
        expect(toBoundedInteger(testNode, 0, 'Limit', 0, 1, 100)).toBe(1);
        expect(toBoundedInteger(testNode, 5000, 'Limit', 0, 1, 100)).toBe(100);
        expect(toBoundedInteger(testNode, -3, 'Page', 0, 1)).toBe(1);
    });

    it('truncates a fractional value', () => {
        expect(toBoundedInteger(testNode, 7.9, 'Limit', 0, 1, 100)).toBe(7);
    });

    it('accepts a numeric string, as an expression may supply', () => {
        expect(toBoundedInteger(testNode, '25', 'Limit', 0, 1, 100)).toBe(25);
    });

    it('rejects a non-numeric value by name', () => {
        expect(() => toBoundedInteger(testNode, 'abc', 'Page', 0, 1)).toThrow(/Page must be a number/);
        expect(() => toBoundedInteger(testNode, undefined, 'Page', 0, 1)).toThrow(NodeOperationError);
    });

    it('leaves the upper bound open when no maximum is given', () => {
        expect(toBoundedInteger(testNode, 9999, 'Page', 0, 1)).toBe(9999);
    });
});

describe('toCollectionEntries', () => {
    it('passes an array of entries through', () => {
        expect(toCollectionEntries(testNode, [{ a: 1 }, { b: 2 }], 'Media items', 0)).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it('treats empty-ish values as no entries', () => {
        expect(toCollectionEntries(testNode, [], 'Media items', 0)).toEqual([]);
        expect(toCollectionEntries(testNode, undefined, 'Media items', 0)).toEqual([]);
        expect(toCollectionEntries(testNode, null, 'Media items', 0)).toEqual([]);
        expect(toCollectionEntries(testNode, '', 'Media items', 0)).toEqual([]);
    });

    it('wraps a lone entry supplied instead of a list', () => {
        expect(toCollectionEntries(testNode, { sourceUrl: 'https://x/a.jpg' }, 'Media items', 0)).toEqual([
            { sourceUrl: 'https://x/a.jpg' }
        ]);
    });

    it('rejects a scalar rather than reading it as no entries', () => {
        expect(() => toCollectionEntries(testNode, 'https://x/a.jpg', 'Media items', 0)).toThrow(
            /Media items entry 1 is not a set of fields/
        );
        expect(() => toCollectionEntries(testNode, 42, 'Media items', 0)).toThrow(NodeOperationError);
    });

    it('names the offending entry inside a list', () => {
        expect(() => toCollectionEntries(testNode, [{ a: 1 }, 'nope'], 'Media items', 0)).toThrow(
            /entry 2 is not a set of fields/
        );
    });
});

describe('assertHttpUrl', () => {
    it('accepts http and https URLs', () => {
        expect(() => assertHttpUrl(testNode, 'https://example.com/a.jpg', 'Field', 0)).not.toThrow();
        expect(() => assertHttpUrl(testNode, 'http://example.com/a.jpg', 'Field', 0)).not.toThrow();
    });

    it('rejects other schemes', () => {
        expect(() => assertHttpUrl(testNode, 'ftp://example.com/a.jpg', 'Field', 0)).toThrow(NodeOperationError);
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
        expect(toAtomTimestamp(testNode, '2026-05-17T10:00:00.123Z', 'Field', 0)).toBe('2026-05-17T10:00:00+00:00');
    });

    it('respects an explicit offset', () => {
        expect(toAtomTimestamp(testNode, '2026-05-17T12:00:00+02:00', 'Field', 0)).toBe('2026-05-17T10:00:00+00:00');
    });

    it('reads a date-only value as local midnight, like a datetime with no offset', () => {
        expect(toAtomTimestamp(testNode, '2026-05-17', 'Field', 0)).toBe(
            toAtomTimestamp(testNode, '2026-05-17T00:00:00', 'Field', 0)
        );
    });

    it('rejects values that are not dates', () => {
        expect(() => toAtomTimestamp(testNode, 'tomorrow-ish', 'Field', 0)).toThrow(NodeOperationError);
    });
});
