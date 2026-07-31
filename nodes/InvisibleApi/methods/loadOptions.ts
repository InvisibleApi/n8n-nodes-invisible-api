import type { IDataObject, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

import { invisibleApiRequest } from '../transport';

export async function getOrganizations(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const organizations = (await invisibleApiRequest.call(
		this,
		'GET',
		'/api/v1/organizations',
	)) as IDataObject[];

	if (!Array.isArray(organizations)) {
		return [];
	}

	return organizations.map((organization) => ({
		name: (organization.name as string) || (organization.id as string),
		value: organization.id as string,
	}));
}

export async function getSocialAccounts(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const organizationId = this.getCurrentNodeParameter('organizationId') as string;
	if (!organizationId) {
		return [];
	}

	const accounts = (await invisibleApiRequest.call(
		this,
		'GET',
		`/api/v1/organizations/${organizationId}/social-accounts`,
	)) as IDataObject[];

	if (!Array.isArray(accounts)) {
		return [];
	}

	return accounts.map((account) => {
		const displayName = (account.displayName as string) || (account.id as string);
		const handle = account.handleOrUsername as string | null | undefined;
		const provider = (account.provider as string) || 'unknown';
		const label = handle ? `${displayName} (@${handle})` : displayName;

		return {
			name: `${label} — ${provider}`,
			value: account.id as string,
		};
	});
}
