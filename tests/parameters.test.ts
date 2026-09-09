import { describe, expect, it } from 'vitest';

import { toStringList, toTrimmedString, toUniqueStringList } from '../nodes/InvisibleApi/helpers/parameters';

describe('toTrimmedString', () => {
    it('trims strings', () => {
        expect(toTrimmedString('  hello  ')).toBe('hello');
    });

    it('coerces numbers', () => {
        expect(toTrimmedString(42)).toBe('42');
    });

    it('turns null and undefined into the empty string', () => {
        expect(toTrimmedString(null)).toBe('');
        expect(toTrimmedString(undefined)).toBe('');
    });
});

describe('toStringList', () => {
    it('accepts an array', () => {
        expect(toStringList([' a ', 'b', ''])).toEqual(['a', 'b']);
    });

    it('splits a comma-separated string', () => {
        expect(toStringList('a, b,,c')).toEqual(['a', 'b', 'c']);
    });

    it('returns an empty list for null and undefined', () => {
        expect(toStringList(null)).toEqual([]);
        expect(toStringList(undefined)).toEqual([]);
    });
});

describe('toUniqueStringList', () => {
    it('drops duplicates while keeping first-seen order', () => {
        expect(toUniqueStringList(['b', 'a', 'b'])).toEqual(['b', 'a']);
    });
});
