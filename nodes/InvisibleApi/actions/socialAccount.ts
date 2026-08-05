import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { toTrimmedString } from '../helpers/parameters';
import { requireValue } from '../helpers/validation';
import { invisibleApiRequest } from '../transport';

export async function executeSocialAccount(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject[]> {
	if (operation === 'getAll') {
		const organizationId = requireValue(
			this.getNode(),
			toTrimmedString(this.getNodeParameter('organizationId', itemIndex)),
			'Organization',
			itemIndex,
		);
		const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;

		const response = (await invisibleApiRequest.call(
			this,
			'GET',
			`/api/v1/organizations/${encodeURIComponent(organizationId)}/social-accounts`,
		)) as IDataObject[];

		const accounts = Array.isArray(response) ? response : [response];
		const provider = toTrimmedString(filters.provider).toLowerCase();

		if (provider === '') {
			return accounts;
		}

		return accounts.filter((account) => String(account.provider ?? '').toLowerCase() === provider);
	}

	throw new NodeOperationError(
		this.getNode(),
		`The operation "${operation}" is not supported for social accounts`,
		{ itemIndex },
	);
}
