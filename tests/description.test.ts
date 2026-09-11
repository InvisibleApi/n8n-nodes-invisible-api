import { NodeHelpers } from 'n8n-workflow';
import type { INodeTypeDescription } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';

import { InvisibleApi } from '../nodes/InvisibleApi/InvisibleApi.node';
import { testNode } from './fixtures';

const description: INodeTypeDescription = new InvisibleApi().description;

function optionValues(propertyName: string, resource?: string): string[] {
    return description.properties
        .filter(
            (property) =>
                property.name === propertyName &&
                (resource === undefined || property.displayOptions?.show?.resource?.includes(resource))
        )
        .flatMap((property) => (property.options ?? []).map((option) => (option as { value: string }).value));
}

/** Every resource/operation pair the node offers, derived from its own description. */
const pairs = optionValues('resource').flatMap((resource) =>
    optionValues('operation', resource).map((operation) => [resource, operation] as const)
);

describe('node description', () => {
    // `it.each([])` generates no tests and passes, so guard the derivation itself.
    it('derives at least one resource/operation pair', () => {
        expect(pairs.length).toBeGreaterThan(0);
    });

    it.each(pairs)(
        'shows the organization field exactly once for %s → %s unless listing organizations',
        (resource, operation) => {
            const expected = resource === 'organization' && operation === 'getAll' ? 0 : 1;

            const shown = description.properties.filter(
                (property) =>
                    property.name === 'organizationId' &&
                    NodeHelpers.displayParameter({ resource, operation }, property, testNode, description)
            );

            expect(shown.length).toBe(expected);
        }
    );
});
