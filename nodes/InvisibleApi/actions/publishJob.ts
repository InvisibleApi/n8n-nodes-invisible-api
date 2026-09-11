import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { AUTO_MEDIA_TYPE, EXPLICIT_MEDIA_TYPES, inferMediaTypeFromUrl } from '../helpers/media';
import { toStringList, toTrimmedString } from '../helpers/parameters';
import {
    API_MAX_LENGTHS,
    API_MAX_MEDIA_ITEMS,
    assertHttpUrl,
    assertMaxLength,
    requireValue,
    toAtomTimestamp,
    toBoundedInteger,
    toCollectionEntries
} from '../helpers/validation';
import { invisibleApiRequest, invisibleApiRequestAllItems } from '../transport';

function buildMediaItems(this: IExecuteFunctions, itemIndex: number, mediaItemsUi: IDataObject[]): IDataObject[] {
    return mediaItemsUi.map((entry, mediaIndex) => {
        const label = `Media item ${mediaIndex + 1}`;
        const sourceUrl = toTrimmedString(entry.sourceUrl);
        if (sourceUrl === '') {
            throw new NodeOperationError(this.getNode(), `${label} is missing a media URL`, {
                itemIndex
            });
        }

        assertMaxLength(this.getNode(), sourceUrl, API_MAX_LENGTHS.sourceUrl, `${label} media URL`, itemIndex);
        assertHttpUrl(this.getNode(), sourceUrl, `${label} media URL`, itemIndex);

        const configuredMediaType = toTrimmedString(entry.mediaType).toLowerCase();
        const useInferredType = configuredMediaType === '' || configuredMediaType === AUTO_MEDIA_TYPE;
        if (!useInferredType && !(EXPLICIT_MEDIA_TYPES as readonly string[]).includes(configuredMediaType)) {
            throw new NodeOperationError(
                this.getNode(),
                `${label} has the unknown media type "${configuredMediaType}"`,
                {
                    itemIndex,
                    description: `Use "${AUTO_MEDIA_TYPE}", "${EXPLICIT_MEDIA_TYPES.join('" or "')}".`
                }
            );
        }

        const mediaItem: IDataObject = {
            mediaType: useInferredType ? inferMediaTypeFromUrl(sourceUrl) : configuredMediaType,
            // The API requires sourceUrl and treats publicFetchUrl as an override;
            // the dashboard submits the one URL it collects as both, so match it.
            sourceUrl,
            publicFetchUrl: sourceUrl
        };

        const altText = toTrimmedString(entry.altText);
        if (altText !== '') {
            assertMaxLength(this.getNode(), altText, API_MAX_LENGTHS.altText, `${label} alt text`, itemIndex);
            mediaItem.altText = altText;
        }

        return mediaItem;
    });
}

export async function executePublishJob(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number
): Promise<IDataObject[]> {
    const organizationId = requireValue(
        this.getNode(),
        toTrimmedString(this.getNodeParameter('organizationId', itemIndex)),
        'Organization',
        itemIndex
    );
    const basePath = `/api/v1/organizations/${encodeURIComponent(organizationId)}/publishing/jobs`;

    if (operation === 'create') {
        const targets = toStringList(this.getNodeParameter('targets', itemIndex, []));
        if (targets.length === 0) {
            throw new NodeOperationError(this.getNode(), 'At least one target is required', {
                itemIndex
            });
        }

        const mediaItemsUi = toCollectionEntries(
            this.getNode(),
            this.getNodeParameter('mediaItems.item', itemIndex, []),
            'Media items',
            itemIndex
        );
        const caption = String(this.getNodeParameter('caption', itemIndex, '') ?? '');

        // The API allows text-only posts on X but requires media for Instagram;
        // an entirely empty post is invalid everywhere, so catch that early.
        if (mediaItemsUi.length === 0 && caption.trim() === '') {
            throw new NodeOperationError(this.getNode(), 'Provide a caption or at least one media item', {
                itemIndex
            });
        }

        if (mediaItemsUi.length > API_MAX_MEDIA_ITEMS) {
            throw new NodeOperationError(
                this.getNode(),
                `The post has ${mediaItemsUi.length} media items, but the API accepts at most ${API_MAX_MEDIA_ITEMS}`,
                { itemIndex }
            );
        }

        const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

        const body: IDataObject = {
            targets
        };

        // Sent untrimmed so intentional leading or trailing line breaks survive.
        if (caption.trim() !== '') {
            assertMaxLength(this.getNode(), caption, API_MAX_LENGTHS.caption, 'Caption', itemIndex);
            body.caption = caption;
        }

        if (mediaItemsUi.length > 0) {
            body.mediaItems = buildMediaItems.call(this, itemIndex, mediaItemsUi);
        }

        const firstComment = toTrimmedString(additionalFields.firstComment);
        if (firstComment !== '') {
            assertMaxLength(this.getNode(), firstComment, API_MAX_LENGTHS.firstComment, 'First comment', itemIndex);
            body.firstComment = firstComment;
        }

        const clientRequestId = toTrimmedString(additionalFields.clientRequestId);
        if (clientRequestId !== '') {
            assertMaxLength(
                this.getNode(),
                clientRequestId,
                API_MAX_LENGTHS.clientRequestId,
                'Client request ID',
                itemIndex
            );
            body.clientRequestId = clientRequestId;
        }

        const requestedPublishAt = toAtomTimestamp(
            this.getNode(),
            additionalFields.requestedPublishAt,
            'Requested publish at',
            itemIndex
        );
        if (requestedPublishAt !== '') {
            body.requestedPublishAt = requestedPublishAt;
        }

        const response = (await invisibleApiRequest.call(this, 'POST', basePath, body)) as IDataObject;

        return [response];
    }

    if (operation === 'get') {
        const publishJobId = requireValue(
            this.getNode(),
            toTrimmedString(this.getNodeParameter('publishJobId', itemIndex)),
            'Publish job ID',
            itemIndex
        );

        const response = (await invisibleApiRequest.call(
            this,
            'GET',
            `${basePath}/${encodeURIComponent(publishJobId)}`
        )) as IDataObject;

        return [response];
    }

    if (operation === 'retry' || operation === 'cancel') {
        const publishJobId = requireValue(
            this.getNode(),
            toTrimmedString(this.getNodeParameter('publishJobId', itemIndex)),
            'Publish job ID',
            itemIndex
        );

        const response = (await invisibleApiRequest.call(
            this,
            'POST',
            `${basePath}/${encodeURIComponent(publishJobId)}/${operation}`
        )) as IDataObject;

        return [response];
    }

    if (operation === 'getAll') {
        const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;

        if (returnAll) {
            return await invisibleApiRequestAllItems.call(this, basePath);
        }

        // The editor enforces the API's 1–100 page size and 1-based page index;
        // expressions bypass both.
        const limit = toBoundedInteger(
            this.getNode(),
            this.getNodeParameter('limit', itemIndex, 50),
            'Limit',
            itemIndex,
            1,
            100
        );
        const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
        const page = toBoundedInteger(this.getNode(), options.page ?? 1, 'Page', itemIndex, 1);

        const response = (await invisibleApiRequest.call(this, 'GET', basePath, undefined, {
            page,
            perPage: limit
        })) as IDataObject[];

        return Array.isArray(response) ? response : [response];
    }

    throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for publish jobs`, {
        itemIndex
    });
}
