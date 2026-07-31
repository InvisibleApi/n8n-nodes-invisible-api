import type { INodeProperties } from 'n8n-workflow';

/**
 * Every resource except `organization` is nested under an organization, and an
 * organization API key is scoped to exactly one organization — so the dropdown
 * normally resolves to a single entry.
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
		hide: { resource: ['organization'] },
	},
};
