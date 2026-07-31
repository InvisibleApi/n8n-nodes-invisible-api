import type { INodeProperties } from 'n8n-workflow';

export const socialAccountOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['socialAccount'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'List the connected accounts that can be used as publish targets',
				action: 'Get many social accounts',
			},
		],
		default: 'getAll',
	},
];

export const socialAccountFields: INodeProperties[] = [
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['socialAccount'], operation: ['getAll'] } },
		options: [
			{
				displayName: 'Provider',
				name: 'provider',
				type: 'string',
				default: '',
				placeholder: 'instagram or x',
				description:
					'Keep only accounts for this provider (instagram, x). Filtered on the returned data, since the endpoint itself returns every publishable account.',
			},
		],
	},
];
