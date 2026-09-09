import type { INodePropertyOptions } from 'n8n-workflow';

/**
 * The account-level metrics the InvisibleAPI backend has verified against the
 * Instagram Login host for `GET /{ig-user-id}/insights`.
 *
 * This list is a client-side convenience only. The backend does not validate
 * metric names — it length-checks the string and forwards it to the Instagram
 * Graph API — so Meta can add or retire a metric without any backend change.
 * That is why the Insights operation also exposes a free-text "Additional
 * Metrics" field: nobody has to wait for a node release to reach a metric that
 * is missing or newly added here.
 *
 * Deliberately absent from the list, all still reachable through Additional
 * Metrics: `impressions`, `profile_views` and `website_clicks` (deprecated —
 * Meta rejects them), `replies` (Meta excludes story replies for accounts in
 * Europe since Dec 2020, so it always reports 0 here), and anything the
 * backend has not verified against the Instagram Login host.
 *
 * The list is deliberately Instagram-specific. Insights capability is resolved
 * per provider and target type on the backend, so another provider means
 * another metric list and another field rather than more entries in this one.
 */
export const INSTAGRAM_ACCOUNT_METRIC_OPTIONS: INodePropertyOptions[] = [
    {
        name: 'Accounts Engaged',
        value: 'accounts_engaged',
        description: 'Accounts that interacted with the profile. Requires Metric Type total_value.'
    },
    {
        name: 'Comments',
        value: 'comments',
        description: 'Comments left on the profile’s posts. Requires Metric Type total_value.'
    },
    {
        name: 'Engaged Audience Demographics',
        value: 'engaged_audience_demographics',
        description:
            'Demographic breakdown of engaged accounts. Requires Period lifetime, Metric Type total_value, a Timeframe and a demographic Breakdown.'
    },
    {
        name: 'Follower Demographics',
        value: 'follower_demographics',
        description:
            'Demographic breakdown of followers. Requires Period lifetime, Metric Type total_value, a Timeframe and a demographic Breakdown.'
    },
    {
        name: 'Follows and Unfollows',
        value: 'follows_and_unfollows',
        description: 'Follows and unfollows. Requires Metric Type total_value and the follow_type breakdown.'
    },
    {
        name: 'Likes',
        value: 'likes',
        description: 'Likes across the profile’s posts. Requires Metric Type total_value.'
    },
    {
        name: 'Profile Links Taps',
        value: 'profile_links_taps',
        description:
            'Taps on profile contact links. Requires Metric Type total_value; pair with the contact_button_type breakdown to split by link.'
    },
    { name: 'Reach', value: 'reach', description: 'Unique accounts that saw any content' },
    {
        name: 'Saves',
        value: 'saves',
        description:
            'Times the profile’s posts were saved. Requires Metric Type total_value. Meta documents this metric as "saved", but the Instagram Login host only accepts "saves".'
    },
    {
        name: 'Shares',
        value: 'shares',
        description: 'Times the profile’s posts were shared. Requires Metric Type total_value.'
    },
    {
        name: 'Total Interactions',
        value: 'total_interactions',
        description: 'Likes, comments, saves and shares combined. Requires Metric Type total_value.'
    },
    {
        name: 'Views',
        value: 'views',
        description: 'Content views. Meta’s replacement for the retired impressions metric.'
    }
];

/** Meta insights period values accepted for account-level metrics. */
export const INSTAGRAM_PERIOD_OPTIONS: INodePropertyOptions[] = [
    { name: 'Day', value: 'day' },
    { name: 'Days 28', value: 'days_28' },
    { name: 'Lifetime', value: 'lifetime' },
    { name: 'Week', value: 'week' }
];
