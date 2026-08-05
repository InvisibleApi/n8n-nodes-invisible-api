/**
 * A `multiOptions` parameter normally resolves to an array, but an expression
 * or AI-tool call can hand back a single string or a comma-separated list
 * instead, so every shape has to be flattened to the same list of trimmed,
 * non-empty strings.
 */
export function toStringList(value: unknown): string[] {
	const raw = Array.isArray(value) ? value : String(value ?? '').split(',');

	return raw.map((entry) => String(entry).trim()).filter((entry) => entry !== '');
}

/**
 * Same normalisation, minus duplicates — used where the value ends up as a
 * comma-separated query parameter and repeating an entry only wastes the
 * budget the API allows for it.
 */
export function toUniqueStringList(value: unknown): string[] {
	return [...new Set(toStringList(value))];
}
