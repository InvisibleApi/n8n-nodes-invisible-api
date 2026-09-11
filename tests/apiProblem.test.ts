import { describe, expect, it } from 'vitest';

import {
    describeApiProblem,
    describeApiProblemMeta,
    extractApiProblem
} from '../nodes/InvisibleApi/helpers/apiProblem';

const problemBody = {
    title: 'Validation failed',
    errors: { caption: 'Too long' },
    errorMeta: { caption: 'caption.too_long' }
};

describe('extractApiProblem', () => {
    it('reads a problem from the error itself', () => {
        expect(extractApiProblem(problemBody)).toEqual(problemBody);
    });

    it.each([
        ['body', { body: problemBody }],
        ['data', { data: problemBody }],
        ['response.body', { response: { body: problemBody } }],
        ['cause.response.body', { cause: { response: { body: problemBody } } }]
    ])('reads a problem nested under %s', (_label, error) => {
        expect(extractApiProblem(error)).toEqual(problemBody);
    });

    it('returns undefined when the errors map is empty', () => {
        expect(extractApiProblem({ title: 'Server error', errors: {} })).toBeUndefined();
    });

    it('returns undefined for plain network-style errors', () => {
        expect(extractApiProblem(new Error('socket hang up'))).toBeUndefined();
        expect(extractApiProblem('boom')).toBeUndefined();
        expect(extractApiProblem(null)).toBeUndefined();
    });

    it('ignores non-string error messages', () => {
        expect(extractApiProblem({ errors: { caption: 42, targets: 'Required' } })).toEqual({
            title: undefined,
            errors: { targets: 'Required' },
            errorMeta: {}
        });
    });
});

describe('describeApiProblem', () => {
    it('joins field errors', () => {
        expect(describeApiProblem({ errors: { a: 'x', b: 'y' }, errorMeta: {} })).toBe('a: x; b: y');
    });
});

describe('describeApiProblemMeta', () => {
    it('lists the stable error keys', () => {
        expect(describeApiProblemMeta(extractApiProblem(problemBody)!)).toBe('Error keys — caption: caption.too_long');
    });

    it('returns undefined when there are no keys', () => {
        expect(describeApiProblemMeta({ errors: { a: 'x' }, errorMeta: {} })).toBeUndefined();
    });
});
