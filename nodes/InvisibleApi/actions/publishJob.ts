import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError, jsonParse } from 'n8n-workflow';

import { toStringList } from '../helpers/parameters';
import { invisibleApiRequest, invisibleApiRequestAllItems } from '../transport';

function buildMediaItems(
	this: IExecuteFunctions,
	itemIndex: number,
	mediaItemsUi: IDataObject[],
): IDataObject[] {
	return mediaItemsUi.map((entry, mediaIndex) => {
		const sourceUrl = ((entry.sourceUrl as string | undefined) ?? '').trim();
		if (sourceUrl === '') {
			throw new NodeOperationError(
				this.getNode(),
				`Media item ${mediaIndex + 1} is missing a source URL`,
				{ itemIndex },
			);
		}

		const mediaItem: IDataObject = {
			mediaType: (entry.mediaType as string | undefined) ?? 'image',
			sourceUrl,
		};

		const publicFetchUrl = ((entry.publicFetchUrl as string | undefined) ?? '').trim();
		if (publicFetchUrl !== '') {
			mediaItem.publicFetchUrl = publicFetchUrl;
		}

		const altText = (entry.altText as string | undefined) ?? '';
		if (altText !== '') {
			mediaItem.altText = altText;
		}

		const sourceAssetId = ((entry.sourceAssetId as string | undefined) ?? '').trim();
		if (sourceAssetId !== '') {
			mediaItem.sourceAssetId = sourceAssetId;
		}

		const metadata = parseMetadata.call(this, itemIndex, mediaIndex, entry.metadata);
		if (metadata !== undefined) {
			mediaItem.metadata = metadata;
		}

		return mediaItem;
	});
}

function parseMetadata(
	this: IExecuteFunctions,
	itemIndex: number,
	mediaIndex: number,
	value: unknown,
): IDataObject | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}

	let metadata: IDataObject;
	if (typeof value === 'string') {
		try {
			metadata = jsonParse<IDataObject>(value);
		} catch {
			throw new NodeOperationError(
				this.getNode(),
				`Metadata of media item ${mediaIndex + 1} is not valid JSON`,
				{ itemIndex },
			);
		}
	} else {
		metadata = value as IDataObject;
	}

	if (Object.keys(metadata).length === 0) {
		return undefined;
	}

	return metadata;
}

export async function executePublishJob(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject[]> {
	const organizationId = this.getNodeParameter('organizationId', itemIndex) as string;
	const basePath = `/api/v1/organizations/${organizationId}/publishing/jobs`;

	if (operation === 'create') {
		const targets = toStringList(this.getNodeParameter('targets', itemIndex, []));
		if (targets.length === 0) {
			throw new NodeOperationError(this.getNode(), 'At least one target is required', {
				itemIndex,
			});
		}

		const mediaItemsUi = this.getNodeParameter('mediaItems.item', itemIndex, []) as IDataObject[];
		const caption = this.getNodeParameter('caption', itemIndex, '') as string;

		// The API allows text-only posts on X but requires media for Instagram;
		// an entirely empty post is invalid everywhere, so catch that early.
		if (mediaItemsUi.length === 0 && caption.trim() === '') {
			throw new NodeOperationError(this.getNode(), 'Provide a caption or at least one media item', {
				itemIndex,
			});
		}

		const additionalFields = this.getNodeParameter(
			'additionalFields',
			itemIndex,
			{},
		) as IDataObject;

		const body: IDataObject = {
			targets,
		};

		if (caption !== '') {
			body.caption = caption;
		}

		if (mediaItemsUi.length > 0) {
			body.mediaItems = buildMediaItems.call(this, itemIndex, mediaItemsUi);
		}

		const firstComment = ((additionalFields.firstComment as string | undefined) ?? '').trim();
		if (firstComment !== '') {
			body.firstComment = firstComment;
		}

		const clientRequestId = ((additionalFields.clientRequestId as string | undefined) ?? '').trim();
		if (clientRequestId !== '') {
			body.clientRequestId = clientRequestId;
		}

		const requestedPublishAt = (additionalFields.requestedPublishAt as string | undefined) ?? '';
		if (requestedPublishAt !== '') {
			body.requestedPublishAt = requestedPublishAt;
		}

		const response = (await invisibleApiRequest.call(this, 'POST', basePath, body)) as IDataObject;

		return [response];
	}

	if (operation === 'get') {
		const publishJobId = this.getNodeParameter('publishJobId', itemIndex) as string;

		const response = (await invisibleApiRequest.call(
			this,
			'GET',
			`${basePath}/${publishJobId}`,
		)) as IDataObject;

		return [response];
	}

	if (operation === 'retry') {
		const publishJobId = this.getNodeParameter('publishJobId', itemIndex) as string;

		const response = (await invisibleApiRequest.call(
			this,
			'POST',
			`${basePath}/${publishJobId}/retry`,
		)) as IDataObject;

		return [response];
	}

	if (operation === 'getAll') {
		const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;

		if (returnAll) {
			return await invisibleApiRequestAllItems.call(this, basePath);
		}

		const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
		const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;

		const response = (await invisibleApiRequest.call(this, 'GET', basePath, undefined, {
			page: (options.page as number | undefined) ?? 1,
			perPage: limit,
		})) as IDataObject[];

		return Array.isArray(response) ? response : [response];
	}

	throw new NodeOperationError(
		this.getNode(),
		`The operation "${operation}" is not supported for publish jobs`,
		{ itemIndex },
	);
}
