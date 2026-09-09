import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { toStringList, toTrimmedString, toUniqueStringList } from '../helpers/parameters';
import { API_MAX_LENGTHS, assertMaxLength, requireValue } from '../helpers/validation';
import { invisibleApiRequest } from '../transport';

const OPTIONAL_QUERY_KEYS = ['since', 'until', 'metric_type', 'breakdown', 'timeframe'] as const;

export async function executeInsights(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number
): Promise<IDataObject[]> {
    if (operation === 'getInstagramAccount') {
        const organizationId = requireValue(
            this.getNode(),
            toTrimmedString(this.getNodeParameter('organizationId', itemIndex)),
            'Organization',
            itemIndex
        );
        const socialAccountId = requireValue(
            this.getNode(),
            toTrimmedString(this.getNodeParameter('socialAccountId', itemIndex)),
            'Social account',
            itemIndex
        );
        const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

        // The selected metrics and the free-text escape hatch end up in the same
        // comma-separated `metric` parameter, so they are merged before the
        // emptiness check — supplying only Additional Metrics is valid.
        const metrics = toUniqueStringList([
            ...toStringList(this.getNodeParameter('metric', itemIndex, [])),
            ...toStringList(additionalFields.additionalMetrics)
        ]);

        if (metrics.length === 0) {
            throw new NodeOperationError(this.getNode(), 'At least one metric is required', {
                itemIndex
            });
        }

        const metric = metrics.join(',');
        assertMaxLength(this.getNode(), metric, API_MAX_LENGTHS.metric, 'Metrics', itemIndex);

        const period = requireValue(
            this.getNode(),
            toTrimmedString(this.getNodeParameter('period', itemIndex, '')),
            'Period',
            itemIndex
        );

        const qs: IDataObject = {
            metric,
            period
        };

        for (const key of OPTIONAL_QUERY_KEYS) {
            const value = toTrimmedString(additionalFields[key]);
            if (value !== '') {
                qs[key] = value;
            }
        }

        const response = (await invisibleApiRequest.call(
            this,
            'GET',
            `/api/v1/organizations/${encodeURIComponent(organizationId)}/insights/instagram/accounts/${encodeURIComponent(socialAccountId)}`,
            undefined,
            qs
        )) as IDataObject;

        return [response];
    }

    throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for insights`, {
        itemIndex
    });
}
