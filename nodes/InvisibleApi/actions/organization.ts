import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { toTrimmedString } from '../helpers/parameters';
import { requireValue } from '../helpers/validation';
import { invisibleApiRequest } from '../transport';

export async function executeOrganization(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number
): Promise<IDataObject[]> {
    if (operation === 'getAll') {
        const response = (await invisibleApiRequest.call(this, 'GET', '/api/v1/organizations')) as IDataObject[];

        return Array.isArray(response) ? response : [response];
    }

    if (operation === 'getLimits') {
        const organizationId = requireValue(
            this.getNode(),
            toTrimmedString(this.getNodeParameter('organizationId', itemIndex)),
            'Organization',
            itemIndex
        );
        const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
        const featureKey = toTrimmedString(filters.featureKey);

        const response = (await invisibleApiRequest.call(
            this,
            'GET',
            `/api/v1/organizations/${encodeURIComponent(organizationId)}/limits`,
            undefined,
            featureKey === '' ? undefined : { featureKey }
        )) as IDataObject[];

        return Array.isArray(response) ? response : [response];
    }

    throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for organizations`, {
        itemIndex
    });
}
