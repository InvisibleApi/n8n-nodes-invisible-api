import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { toUniqueStringList } from '../helpers/parameters';
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

		// The selected metrics and the free-text escape hatch end up in the same
		// comma-separated `metric` parameter, so they are merged before the
		// emptiness check — supplying only Additional Metrics is valid.
		const metrics = toUniqueStringList([
			...toUniqueStringList(this.getNodeParameter('metric', itemIndex, [])),
			...toUniqueStringList(additionalFields.additionalMetrics),
		]);

		if (metrics.length === 0) {
			throw new NodeOperationError(this.getNode(), 'At least one metric is required', {
				itemIndex,
			});
		}

		const period = String(this.getNodeParameter('period', itemIndex, '') ?? '').trim();
		if (period === '') {
			throw new NodeOperationError(this.getNode(), 'A period is required', { itemIndex });
		}

		const qs: IDataObject = {
			metric: metrics.join(','),
			period,
		};

		for (const key of OPTIONAL_QUERY_KEYS) {
			const value = String(additionalFields[key] ?? '').trim();
			if (value !== '') {
				qs[key] = value;
			}
		}

		const response = (await invisibleApiRequest.call(
			this,
			'GET',
			`/api/v1/organizations/${encodeURIComponent(organizationId)}/insights/instagram/accounts/${encodeURIComponent(socialAccountId)}`,
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
