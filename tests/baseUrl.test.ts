import { NodeOperationError } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';

import {
    assertSupportedBaseUrl,
    BASE_URL_TEST_EXPRESSION,
    DEFAULT_BASE_URL,
    normalizeBaseUrl
} from '../nodes/InvisibleApi/transport/baseUrl';
import { testNode } from './fixtures';

describe('normalizeBaseUrl', () => {
    it('strips trailing slashes and surrounding whitespace', () => {
        expect(normalizeBaseUrl(' https://example.com/// ')).toBe('https://example.com');
    });

    it('falls back to the default for empty-ish values', () => {
        expect(normalizeBaseUrl('')).toBe(DEFAULT_BASE_URL);
        expect(normalizeBaseUrl('   ')).toBe(DEFAULT_BASE_URL);
        expect(normalizeBaseUrl(undefined)).toBe(DEFAULT_BASE_URL);
        expect(normalizeBaseUrl(null)).toBe(DEFAULT_BASE_URL);
    });

    it('falls back to the default for slash-only values', () => {
        expect(normalizeBaseUrl('///')).toBe(DEFAULT_BASE_URL);
    });
});

describe('BASE_URL_TEST_EXPRESSION', () => {
    // The credential test runs this as an n8n expression, outside this module.
    // Evaluating its body against normalizeBaseUrl pins the two to each other.
    const body = BASE_URL_TEST_EXPRESSION.match(/^=\{\{ (.*) \}\}$/)?.[1];
    // The rule targets shipped node code, where this would run on user data; here
    // the evaluated string is a constant from this repo.
    // eslint-disable-next-line @n8n/community-nodes/no-dangerous-functions
    const evaluate = new Function('$credentials', `return ${body};`) as (credentials: { baseUrl?: string }) => string;

    it('is wrapped as an n8n expression', () => {
        expect(body).toBeDefined();
    });

    it.each(['', '   ', '///', 'https://example.com', 'https://example.com///', ' https://x '])(
        'matches normalizeBaseUrl for %j',
        (input) => {
            expect(evaluate({ baseUrl: input })).toBe(normalizeBaseUrl(input));
        }
    );

    it('matches normalizeBaseUrl for a missing value', () => {
        expect(evaluate({})).toBe(normalizeBaseUrl(undefined));
    });
});

describe('assertSupportedBaseUrl', () => {
    it('accepts http and https URLs', () => {
        expect(() => assertSupportedBaseUrl(testNode, DEFAULT_BASE_URL)).not.toThrow();
        expect(() => assertSupportedBaseUrl(testNode, 'http://localhost:8080')).not.toThrow();
    });

    it('rejects other schemes', () => {
        expect(() => assertSupportedBaseUrl(testNode, 'ftp://example.com')).toThrow(NodeOperationError);
    });

    it('rejects values that are not absolute URLs', () => {
        expect(() => assertSupportedBaseUrl(testNode, 'example.com')).toThrow(NodeOperationError);
    });
});
