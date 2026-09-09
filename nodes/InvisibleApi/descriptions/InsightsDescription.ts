import type { INodeProperties } from 'n8n-workflow';

import { INSTAGRAM_ACCOUNT_METRIC_OPTIONS, INSTAGRAM_PERIOD_OPTIONS } from './instagramMetrics';

export const insightsOperations: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['insights'] } },
        options: [
            {
                name: 'Get Instagram Account Insights',
                value: 'getInstagramAccount',
                description: 'Fetch Instagram account-level insights for a connected account',
                action: 'Get account insights'
            }
        ],
        default: 'getInstagramAccount'
    }
];

export const insightsFields: INodeProperties[] = [
    {
        displayName: 'Social Account Name or ID',
        name: 'socialAccountId',
        type: 'options',
        typeOptions: {
            loadOptionsMethod: 'getInstagramSocialAccounts',
            loadOptionsDependsOn: ['organizationId']
        },
        required: true,
        default: '',
        description:
            'Instagram account to read insights for. Only Instagram professional accounts are listed, since insights are not available for other providers. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
        displayOptions: { show: { resource: ['insights'], operation: ['getInstagramAccount'] } }
    },
    {
        displayName: 'Metrics',
        name: 'metric',
        type: 'multiOptions',
        required: true,
        default: [],
        options: INSTAGRAM_ACCOUNT_METRIC_OPTIONS,
        description:
            'Meta insights metrics to request. Several metrics (for example accounts_engaged, total_interactions, likes) are only returned when Metric Type is set to total_value. Use Additional Metrics for anything not listed here.',
        displayOptions: { show: { resource: ['insights'], operation: ['getInstagramAccount'] } }
    },
    {
        displayName: 'Period',
        name: 'period',
        type: 'options',
        required: true,
        default: 'day',
        options: INSTAGRAM_PERIOD_OPTIONS,
        description:
            'Meta insights period. Most account metrics use Day; demographics metrics (follower_demographics, engaged_audience_demographics) require Lifetime together with a Timeframe, Metric Type total_value and a demographic Breakdown.',
        displayOptions: { show: { resource: ['insights'], operation: ['getInstagramAccount'] } }
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['insights'], operation: ['getInstagramAccount'] } },
        options: [
            {
                displayName: 'Additional Metrics',
                name: 'additionalMetrics',
                type: 'string',
                default: '',
                placeholder: 'metric_name,another_metric',
                description:
                    'Extra metric names to request alongside the Metrics selection, separated by commas. The API forwards metric names to Meta without validating them, so use this to reach a metric Meta has added since this node was released.'
            },
            {
                displayName: 'Breakdown',
                name: 'breakdown',
                type: 'options',
                default: 'media_product_type',
                options: [
                    { name: 'Age', value: 'age' },
                    { name: 'City', value: 'city' },
                    { name: 'Contact Button Type', value: 'contact_button_type' },
                    { name: 'Country', value: 'country' },
                    { name: 'Follow Type', value: 'follow_type' },
                    { name: 'Gender', value: 'gender' },
                    { name: 'Media Product Type', value: 'media_product_type' }
                ],
                description:
                    'Breakdown dimension for Metric Type total_value results. Which one applies depends on the metric. Demographics metrics require Country, City, Age or Gender. Meta documents a follower_type breakdown for views, but the Instagram Login host only accepts Follow Type.'
            },
            {
                displayName: 'Metric Type',
                name: 'metric_type',
                type: 'options',
                default: 'total_value',
                options: [
                    { name: 'Time Series', value: 'time_series' },
                    { name: 'Total Value', value: 'total_value' }
                ],
                description: 'Meta aggregation mode. Meta silently omits several metrics from time-series responses.'
            },
            {
                displayName: 'Since',
                name: 'since',
                type: 'string',
                default: '',
                placeholder: '2026-05-01T00:00:00Z',
                description: 'Lower time bound, as a Unix timestamp or ISO 8601 string'
            },
            {
                displayName: 'Timeframe',
                name: 'timeframe',
                type: 'options',
                default: 'this_week',
                options: [
                    { name: 'This Month', value: 'this_month' },
                    { name: 'This Week', value: 'this_week' }
                ],
                description:
                    'Required by Meta for demographics metrics (follower_demographics, engaged_audience_demographics). Meta gives it precedence over Since and Until.'
            },
            {
                displayName: 'Until',
                name: 'until',
                type: 'string',
                default: '',
                placeholder: '1716681600',
                description: 'Upper time bound, as a Unix timestamp or ISO 8601 string'
            }
        ]
    }
];
