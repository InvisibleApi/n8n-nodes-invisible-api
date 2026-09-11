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
                action: 'Get many social accounts'
            }
        ],
        default: 'getAll'
    }
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
                displayName: 'Providers',
                name: 'provider',
                type: 'multiOptions',
                default: [],
                options: [
                    { name: 'Instagram', value: 'instagram' },
                    { name: 'X', value: 'x' }
                ],
                description:
                    'Keep only accounts for the selected providers. Leave empty to return all of them. Filtered on the returned data, since the endpoint returns every publishable account and accepts no provider parameter.'
            }
        ]
    }
];
