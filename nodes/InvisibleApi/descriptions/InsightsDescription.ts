import type { INodeProperties } from 'n8n-workflow';

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
				action: 'Get account insights',
			},
		],
		default: 'getInstagramAccount',
	},
];

export const insightsFields: INodeProperties[] = [
	{
		displayName: 'Social Account Name or ID',
		name: 'socialAccountId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getSocialAccounts',
			loadOptionsDependsOn: ['organizationId'],
		},
		required: true,
		default: '',
		description:
			'Instagram account to read insights for. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { resource: ['insights'], operation: ['getInstagramAccount'] } },
	},
	{
		displayName: 'Metric',
		name: 'metric',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'reach,accounts_engaged',
		description:
			'Meta insights metric, or several separated by commas. Some metrics (for example accounts_engaged, total_interactions, likes) are only returned when Metric Type is set to total_value.',
		displayOptions: { show: { resource: ['insights'], operation: ['getInstagramAccount'] } },
	},
	{
		displayName: 'Period',
		name: 'period',
		type: 'string',
		required: true,
		default: 'day',
		placeholder: 'day',
		description: 'Meta insights period, such as day, week, days_28 or lifetime',
		displayOptions: { show: { resource: ['insights'], operation: ['getInstagramAccount'] } },
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
				displayName: 'Breakdown',
				name: 'breakdown',
				type: 'options',
				default: 'media_product_type',
				options: [
					{ name: 'Contact Button Type', value: 'contact_button_type' },
					{ name: 'Follow Type', value: 'follow_type' },
					{ name: 'Follower Type', value: 'follower_type' },
					{ name: 'Media Product Type', value: 'media_product_type' },
				],
				description:
					'Breakdown dimension for Metric Type total_value results. Which one applies depends on the metric; the API rejects any other value.',
			},
			{
				displayName: 'Metric Type',
				name: 'metric_type',
				type: 'options',
				default: 'total_value',
				options: [
					{ name: 'Time Series', value: 'time_series' },
					{ name: 'Total Value', value: 'total_value' },
				],
				description:
					'Meta aggregation mode. Meta silently omits several metrics from time-series responses.',
			},
			{
				displayName: 'Since',
				name: 'since',
				type: 'string',
				default: '',
				placeholder: '2026-05-01T00:00:00Z',
				description: 'Lower time bound, as a Unix timestamp or ISO 8601 string',
			},
			{
				displayName: 'Timeframe',
				name: 'timeframe',
				type: 'options',
				default: 'this_week',
				options: [
					{ name: 'This Month', value: 'this_month' },
					{ name: 'This Week', value: 'this_week' },
				],
				description:
					'Required by Meta for demographics metrics (follower_demographics, engaged_audience_demographics). Meta gives it precedence over Since and Until.',
			},
			{
				displayName: 'Until',
				name: 'until',
				type: 'string',
				default: '',
				placeholder: '1716681600',
				description: 'Upper time bound, as a Unix timestamp or ISO 8601 string',
			},
		],
	},
];
