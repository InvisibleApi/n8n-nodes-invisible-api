import type { IDataObject } from 'n8n-workflow';

/**
 * The API reports validation and conflict failures as a per-field `errors` map
 * plus an `errorMeta` map of stable keys. That detail is the only part telling
 * a user what to change, and a bare status throws it away.
 */
export interface ApiProblem {
    title?: string;
    errors: Record<string, string>;
    errorMeta: Record<string, string>;
}

function toMessageMap(value: unknown): Record<string, string> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    const entries = Object.entries(value as IDataObject)
        .filter(([, message]) => typeof message === 'string' && message !== '')
        .map(([field, message]) => [field, message as string] as const);

    return Object.fromEntries(entries);
}

/** The body sits at a different key depending on how the request failed. */
function candidateBodies(error: unknown): unknown[] {
    if (error === null || typeof error !== 'object') {
        return [];
    }

    const source = error as IDataObject;
    const response = source.response as IDataObject | undefined;
    const cause = source.cause as IDataObject | undefined;

    return [
        source,
        source.body,
        source.data,
        source.error,
        response,
        response?.body,
        response?.data,
        cause,
        cause?.body,
        (cause?.response as IDataObject | undefined)?.body
    ];
}

export function extractApiProblem(error: unknown): ApiProblem | undefined {
    for (const body of candidateBodies(error)) {
        if (body === null || typeof body !== 'object') {
            continue;
        }

        const candidate = body as IDataObject;
        const errors = toMessageMap(candidate.errors);

        // Requiring a populated map keeps ordinary network errors on the default
        // handling rather than reporting them as an empty validation failure.
        if (Object.keys(errors).length === 0) {
            continue;
        }

        return {
            title: typeof candidate.title === 'string' ? candidate.title : undefined,
            errors,
            errorMeta: toMessageMap(candidate.errorMeta)
        };
    }

    return undefined;
}

export function describeApiProblem(problem: ApiProblem): string {
    return Object.entries(problem.errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join('; ');
}

export function describeApiProblemMeta(problem: ApiProblem): string | undefined {
    const keys = Object.entries(problem.errorMeta).map(([field, key]) => `${field}: ${key}`);

    return keys.length > 0 ? `Error keys — ${keys.join('; ')}` : undefined;
}
