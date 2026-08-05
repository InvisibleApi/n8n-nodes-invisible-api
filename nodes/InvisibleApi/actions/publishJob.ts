import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError, jsonParse } from 'n8n-workflow';

import { toStringList, toTrimmedString } from '../helpers/parameters';
import {
	API_MAX_LENGTHS,
	assertHttpUrl,
	assertMaxLength,
	requireValue,
	toAtomTimestamp,
} from '../helpers/validation';
import { invisibleApiRequest, invisibleApiRequestAllItems } from '../transport';

function buildMediaItems(
	this: IExecuteFunctions,
	itemIndex: number,
	mediaItemsUi: IDataObject[],
): IDataObject[] {
	return mediaItemsUi.map((entry, mediaIndex) => {
		const label = `Media item ${mediaIndex + 1}`;
		const sourceUrl = toTrimmedString(entry.sourceUrl);
		if (sourceUrl === '') {
			throw new NodeOperationError(this.getNode(), `${label} is missing a source URL`, {
				itemIndex,
			});
		}

		assertMaxLength(
			this.getNode(),
			sourceUrl,
			API_MAX_LENGTHS.sourceUrl,
			`${label} source URL`,
			itemIndex,
		);
		assertHttpUrl(this.getNode(), sourceUrl, `${label} source URL`, itemIndex);

		const mediaItem: IDataObject = {
			mediaType: toTrimmedString(entry.mediaType) || 'image',
			sourceUrl,
		};

		const publicFetchUrl = toTrimmedString(entry.publicFetchUrl);
		if (publicFetchUrl !== '') {
			assertMaxLength(
				this.getNode(),
				publicFetchUrl,
				API_MAX_LENGTHS.publicFetchUrl,
				`${label} public fetch URL`,
				itemIndex,
			);
			assertHttpUrl(this.getNode(), publicFetchUrl, `${label} public fetch URL`, itemIndex);
			mediaItem.publicFetchUrl = publicFetchUrl;
		}

		const altText = toTrimmedString(entry.altText);
		if (altText !== '') {
			assertMaxLength(
				this.getNode(),
				altText,
				API_MAX_LENGTHS.altText,
				`${label} alt text`,
				itemIndex,
			);
			mediaItem.altText = altText;
		}

		const sourceAssetId = toTrimmedString(entry.sourceAssetId);
		if (sourceAssetId !== '') {
			assertMaxLength(
				this.getNode(),
				sourceAssetId,
				API_MAX_LENGTHS.sourceAssetId,
				`${label} source asset ID`,
				itemIndex,
			);
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

	let metadata: unknown = value;
	if (typeof value === 'string') {
		try {
			metadata = jsonParse<unknown>(value);
		} catch {
			throw new NodeOperationError(
				this.getNode(),
				`Metadata of media item ${mediaIndex + 1} is not valid JSON`,
				{ itemIndex },
			);
		}
	}

	// A JSON array or scalar passes the API's loose type check and is stored as
	// unusable metadata.
	if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata)) {
		throw new NodeOperationError(
			this.getNode(),
			`Metadata of media item ${mediaIndex + 1} must be a JSON object`,
			{ itemIndex },
		);
	}

	const parsed = metadata as IDataObject;

	return Object.keys(parsed).length === 0 ? undefined : parsed;
}

export async function executePublishJob(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject[]> {
	const organizationId = requireValue(
		this.getNode(),
		toTrimmedString(this.getNodeParameter('organizationId', itemIndex)),
		'Organization',
		itemIndex,
	);
	const basePath = `/api/v1/organizations/${encodeURIComponent(organizationId)}/publishing/jobs`;

	if (operation === 'create') {
		const targets = toStringList(this.getNodeParameter('targets', itemIndex, []));
		if (targets.length === 0) {
			throw new NodeOperationError(this.getNode(), 'At least one target is required', {
				itemIndex,
			});
		}

		const mediaItemsUi = this.getNodeParameter('mediaItems.item', itemIndex, []) as IDataObject[];
		const caption = String(this.getNodeParameter('caption', itemIndex, '') ?? '');

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
			assertMaxLength(
				this.getNode(),
				firstComment,
				API_MAX_LENGTHS.firstComment,
				'First comment',
				itemIndex,
			);
			body.firstComment = firstComment;
		}

		const clientRequestId = toTrimmedString(additionalFields.clientRequestId);
		if (clientRequestId !== '') {
			assertMaxLength(
				this.getNode(),
				clientRequestId,
				API_MAX_LENGTHS.clientRequestId,
				'Client request ID',
				itemIndex,
			);
			body.clientRequestId = clientRequestId;
		}

		const requestedPublishAt = toAtomTimestamp(
			this.getNode(),
			additionalFields.requestedPublishAt,
			'Requested publish at',
			itemIndex,
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
			itemIndex,
		);

		const response = (await invisibleApiRequest.call(
			this,
			'GET',
			`${basePath}/${encodeURIComponent(publishJobId)}`,
		)) as IDataObject;

		return [response];
	}

	if (operation === 'retry') {
		const publishJobId = requireValue(
			this.getNode(),
			toTrimmedString(this.getNodeParameter('publishJobId', itemIndex)),
			'Publish job ID',
			itemIndex,
		);

		const response = (await invisibleApiRequest.call(
			this,
			'POST',
			`${basePath}/${encodeURIComponent(publishJobId)}/retry`,
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
