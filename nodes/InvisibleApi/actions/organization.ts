import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { invisibleApiRequest } from '../transport';

export async function executeOrganization(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject[]> {
	if (operation === 'getAll') {
		const response = (await invisibleApiRequest.call(
			this,
			'GET',
			'/api/v1/organizations',
		)) as IDataObject[];

		return Array.isArray(response) ? response : [response];
	}

	throw new NodeOperationError(
		this.getNode(),
		`The operation "${operation}" is not supported for organizations`,
		{ itemIndex },
	);
}
