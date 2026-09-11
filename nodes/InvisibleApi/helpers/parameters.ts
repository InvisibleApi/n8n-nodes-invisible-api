/**
 * Expressions and AI-tool calls can resolve a `string` field to a number, so
 * coerce before trimming.
 */
export function toTrimmedString(value: unknown): string {
    return String(value ?? '').trim();
}

/** A `multiOptions` value may arrive as an array or as a comma-separated string. */
export function toStringList(value: unknown): string[] {
    const raw = Array.isArray(value) ? value : String(value ?? '').split(',');

    return raw.map((entry) => toTrimmedString(entry)).filter((entry) => entry !== '');
}

export function toUniqueStringList(value: unknown): string[] {
    return [...new Set(toStringList(value))];
}
