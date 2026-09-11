import type { INodeProperties } from 'n8n-workflow';

import { organizationIdField } from './common';

export const organizationOperations: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['organization'] } },
        options: [
            {
                name: 'Get Limits',
                value: 'getLimits',
                description:
                    'List the effective paid-plan limit snapshots of an organization: configured limit, current usage, active reservations, remaining allowance and reset time per connected account',
                action: 'Get organization limits'
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'List the organizations this API key can reach',
                action: 'Get many organizations'
            }
        ],
        default: 'getAll'
    }
];

export const organizationFields: INodeProperties[] = [
    // Get Many lists organizations, so only Get Limits needs one selected.
    {
        ...organizationIdField,
        typeOptions: { ...organizationIdField.typeOptions },
        displayOptions: { show: { resource: ['organization'], operation: ['getLimits'] } }
    },
    {
        displayName: 'Filters',
        name: 'filters',
        type: 'collection',
        placeholder: 'Add Filter',
        default: {},
        displayOptions: { show: { resource: ['organization'], operation: ['getLimits'] } },
        options: [
            {
                displayName: 'Feature Key',
                name: 'featureKey',
                type: 'options',
                default: 'publishing.posts.published.per_account.period',
                options: [
                    {
                        name: 'Published Posts Per Account Per Period',
                        value: 'publishing.posts.published.per_account.period'
                    }
                ],
                description: 'Return only the snapshots of one feature limit'
            }
        ]
    }
];
