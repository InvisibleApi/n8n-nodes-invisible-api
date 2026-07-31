import type { INodeProperties } from 'n8n-workflow';

export const organizationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['organization'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'List the organizations this API key can reach',
				action: 'Get many organizations',
			},
		],
		default: 'getAll',
	},
];

export const organizationFields: INodeProperties[] = [];
