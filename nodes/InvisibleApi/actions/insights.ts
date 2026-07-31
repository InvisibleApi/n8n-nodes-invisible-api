import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { invisibleApiRequest } from '../transport';

const OPTIONAL_QUERY_KEYS = ['since', 'until', 'metric_type', 'breakdown', 'timeframe'] as const;

export async function executeInsights(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject[]> {
	if (operation === 'getInstagramAccount') {
		const organizationId = this.getNodeParameter('organizationId', itemIndex) as string;
		const socialAccountId = this.getNodeParameter('socialAccountId', itemIndex) as string;
		const additionalFields = this.getNodeParameter(
			'additionalFields',
			itemIndex,
			{},
		) as IDataObject;

		const metric = (this.getNodeParameter('metric', itemIndex) as string).trim();
		if (metric === '') {
			throw new NodeOperationError(this.getNode(), 'At least one metric is required', {
				itemIndex,
			});
		}

		const qs: IDataObject = {
			metric,
			period: (this.getNodeParameter('period', itemIndex) as string).trim(),
		};

		for (const key of OPTIONAL_QUERY_KEYS) {
			const value = ((additionalFields[key] as string | undefined) ?? '').trim();
			if (value !== '') {
				qs[key] = value;
			}
		}

		const response = (await invisibleApiRequest.call(
			this,
			'GET',
			`/api/v1/organizations/${organizationId}/insights/instagram/accounts/${socialAccountId}`,
			undefined,
			qs,
		)) as IDataObject;

		return [response];
	}

	throw new NodeOperationError(
		this.getNode(),
		`The operation "${operation}" is not supported for insights`,
		{ itemIndex },
	);
}
