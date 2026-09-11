import type { INodeProperties } from 'n8n-workflow';

/**
 * Every request except the organization list runs against one organization, and
 * an organization API key is scoped to exactly one organization — so the
 * dropdown normally resolves to a single entry.
 *
 * Hidden for the organization resource as a whole; the organization operations
 * that do need it add their own copy (see `OrganizationDescription`). Keep this
 * `hide` to a single key: n8n hides a parameter when *any* listed key matches,
 * so `hide: { resource: ['organization'], operation: ['getAll'] }` would also
 * hide the field for every other resource's Get Many.
 */
export const organizationIdField: INodeProperties = {
    displayName: 'Organization Name or ID',
    name: 'organizationId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getOrganizations' },
    required: true,
    default: '',
    description:
        'Organization the request runs against. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
        hide: { resource: ['organization'] }
    }
};
