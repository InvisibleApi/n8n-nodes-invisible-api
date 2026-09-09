import type { IDataObject, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

import { invisibleApiRequest } from '../transport';

/** Provider/target-type pair the API reports for Instagram professional accounts. */
const INSTAGRAM_PROVIDER = 'instagram';
const INSTAGRAM_TARGET_TYPE = 'instagram_professional_account';

export async function getOrganizations(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const organizations = (await invisibleApiRequest.call(this, 'GET', '/api/v1/organizations')) as IDataObject[];

    if (!Array.isArray(organizations)) {
        return [];
    }

    return organizations.map((organization) => ({
        name: (organization.name as string) || (organization.id as string),
        value: organization.id as string
    }));
}

async function fetchSocialAccounts(this: ILoadOptionsFunctions): Promise<IDataObject[]> {
    const organizationId = this.getCurrentNodeParameter('organizationId') as string;
    if (!organizationId) {
        return [];
    }

    const accounts = (await invisibleApiRequest.call(
        this,
        'GET',
        `/api/v1/organizations/${encodeURIComponent(organizationId)}/social-accounts`
    )) as IDataObject[];

    return Array.isArray(accounts) ? accounts : [];
}

function toAccountOption(account: IDataObject): INodePropertyOptions {
    const displayName = (account.displayName as string) || (account.id as string);
    const handle = account.handleOrUsername as string | null | undefined;
    const provider = (account.provider as string) || 'unknown';
    const label = handle ? `${displayName} (@${handle})` : displayName;

    return {
        name: `${label} — ${provider}`,
        value: account.id as string
    };
}

export async function getSocialAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const accounts = await fetchSocialAccounts.call(this);

    return accounts.map(toAccountOption);
}

/**
 * Insights are Instagram-only: the API resolves insights capability per
 * provider and target type, and every other combination is rejected with a
 * conflict. Listing X accounts here would only offer choices that cannot work,
 * so they are filtered out.
 *
 * Capability also depends on the account having granted the insights scope,
 * which this endpoint does not report — so a listed account can still be
 * refused at request time.
 */
export async function getInstagramSocialAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const accounts = await fetchSocialAccounts.call(this);

    return accounts
        .filter(
            (account) =>
                String(account.provider ?? '').toLowerCase() === INSTAGRAM_PROVIDER &&
                String(account.targetType ?? '').toLowerCase() === INSTAGRAM_TARGET_TYPE
        )
        .map((account) => {
            const displayName = (account.displayName as string) || (account.id as string);
            const handle = account.handleOrUsername as string | null | undefined;

            return {
                name: handle ? `${displayName} (@${handle})` : displayName,
                value: account.id as string
            };
        });
}
