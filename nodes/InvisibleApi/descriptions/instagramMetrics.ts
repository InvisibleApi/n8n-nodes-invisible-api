import type { INodePropertyOptions } from 'n8n-workflow';

/**
 * Account-level metrics Meta documents for `GET /{ig-user-id}/insights`.
 *
 * This list is a client-side convenience only. The InvisibleAPI backend does
 * not validate metric names — it length-checks the string and forwards it to
 * the Instagram Graph API — so Meta can add or retire a metric without any
 * backend change. That is why the Insights operation also exposes a free-text
 * "Additional Metrics" field: nobody has to wait for a node release to reach a
 * metric that is missing or newly added here.
 *
 * The list is deliberately Instagram-specific. Insights capability is resolved
 * per provider and target type on the backend, so another provider means
 * another metric list and another field rather than more entries in this one.
 */
export const INSTAGRAM_ACCOUNT_METRIC_OPTIONS: INodePropertyOptions[] = [
	{
		name: 'Accounts Engaged',
		value: 'accounts_engaged',
		description: 'Accounts that interacted with the profile. Requires Metric Type total_value.',
	},
	{
		name: 'Comments',
		value: 'comments',
		description: 'Comments left on the profile’s posts. Requires Metric Type total_value.',
	},
	{
		name: 'Engaged Audience Demographics',
		value: 'engaged_audience_demographics',
		description:
			'Demographic breakdown of engaged accounts. Requires Metric Type total_value and a Timeframe.',
	},
	{
		name: 'Follower Count',
		value: 'follower_count',
		description: 'New followers gained over the period',
	},
	{
		name: 'Follower Demographics',
		value: 'follower_demographics',
		description:
			'Demographic breakdown of followers. Requires Metric Type total_value and a Timeframe.',
	},
	{
		name: 'Follows and Unfollows',
		value: 'follows_and_unfollows',
		description:
			'Follows and unfollows. Requires Metric Type total_value and the follow_type breakdown.',
	},
	{
		name: 'Likes',
		value: 'likes',
		description: 'Likes across the profile’s posts. Requires Metric Type total_value.',
	},
	{
		name: 'Online Followers',
		value: 'online_followers',
		description: 'Hourly distribution of when followers are online',
	},
	{
		name: 'Profile Links Taps',
		value: 'profile_links_taps',
		description:
			'Taps on profile contact links. Requires Metric Type total_value; pair with the contact_button_type breakdown to split by link.',
	},
	{
		name: 'Profile Views',
		value: 'profile_views',
		description: 'Times the profile was viewed',
	},
	{ name: 'Reach', value: 'reach', description: 'Unique accounts that saw any content' },
	{
		name: 'Reached Audience Demographics',
		value: 'reached_audience_demographics',
		description:
			'Demographic breakdown of reached accounts. Requires Metric Type total_value and a Timeframe.',
	},
	{
		name: 'Replies',
		value: 'replies',
		description: 'Story replies. Requires Metric Type total_value.',
	},
	{
		name: 'Saves',
		value: 'saves',
		description: 'Times the profile’s posts were saved. Requires Metric Type total_value.',
	},
	{
		name: 'Shares',
		value: 'shares',
		description: 'Times the profile’s posts were shared. Requires Metric Type total_value.',
	},
	{
		name: 'Total Interactions',
		value: 'total_interactions',
		description: 'Likes, comments, saves and shares combined. Requires Metric Type total_value.',
	},
	{
		name: 'Views',
		value: 'views',
		description: 'Content views. Meta’s replacement for the retired impressions metric.',
	},
	{
		name: 'Website Clicks',
		value: 'website_clicks',
		description: 'Taps on the website link in the profile',
	},
];

/** Meta insights period values accepted for account-level metrics. */
export const INSTAGRAM_PERIOD_OPTIONS: INodePropertyOptions[] = [
	{ name: 'Day', value: 'day' },
	{ name: 'Days 28', value: 'days_28' },
	{ name: 'Lifetime', value: 'lifetime' },
	{ name: 'Week', value: 'week' },
];
