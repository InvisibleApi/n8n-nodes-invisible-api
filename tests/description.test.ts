import { NodeHelpers } from 'n8n-workflow';
import type { INodeProperties, INodeTypeDescription } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';

import { InvisibleApi } from '../nodes/InvisibleApi/InvisibleApi.node';

const description: INodeTypeDescription = new InvisibleApi().description;
const node = { typeVersion: description.version as number };

function resourceValues(): string[] {
	const resource = description.properties.find((property) => property.name === 'resource');
	return (resource?.options ?? []).map((option) => (option as { value: string }).value);
}

function operationValues(resource: string): string[] {
	return description.properties
		.filter(
			(property: INodeProperties) =>
				property.name === 'operation' &&
				property.displayOptions?.show?.resource?.includes(resource),
		)
		.flatMap((property) =>
			(property.options ?? []).map((option) => (option as { value: string }).value),
		);
}

/** Names of the parameters n8n would display for the given resource/operation pair. */
function displayedParameters(resource: string, operation: string): string[] {
	const parameters = NodeHelpers.getNodeParameters(
		description.properties,
		{ resource, operation },
		true,
		false,
		node,
		description,
	);

	return Object.keys(parameters ?? {});
}

describe('node description', () => {
	const pairs = resourceValues().flatMap((resource) =>
		operationValues(resource).map((operation) => [resource, operation] as const),
	);

	it('declares at least one operation per resource', () => {
		for (const resource of resourceValues()) {
			expect(operationValues(resource).length, resource).toBeGreaterThan(0);
		}
	});

	it.each(pairs)(
		'shows the organization field for %s → %s unless listing organizations',
		(resource, operation) => {
			const expected = !(resource === 'organization' && operation === 'getAll');

			expect(displayedParameters(resource, operation).includes('organizationId')).toBe(expected);
		},
	);

	it('never shows the organization field twice', () => {
		for (const [resource, operation] of pairs) {
			const shown = description.properties.filter(
				(property) =>
					property.name === 'organizationId' &&
					NodeHelpers.displayParameter({ resource, operation }, property, node, description),
			);

			expect(shown.length, `${resource} → ${operation}`).toBeLessThanOrEqual(1);
		}
	});
});
