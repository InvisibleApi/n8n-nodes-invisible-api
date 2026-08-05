import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export const CREDENTIALS_NAME = 'invisibleApi';
export const DEFAULT_BASE_URL = 'https://api.invisibleapi.ai';

export type InvisibleApiResponse = IDataObject | IDataObject[];

/**
 * Single entry point for every InvisibleAPI call. Keeps auth, base URL
 * resolution and JSON handling in one place so new resources only have to
 * describe their endpoint.
 */
export async function invisibleApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<InvisibleApiResponse> {
	const credentials = await this.getCredentials(CREDENTIALS_NAME);
	const configuredBaseUrl = (credentials.baseUrl as string | undefined) ?? '';
	const baseUrl = (configuredBaseUrl.trim() || DEFAULT_BASE_URL).replace(/\/+$/, '');

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		headers: { Accept: 'application/json' },
		json: true,
	};

	if (qs !== undefined && Object.keys(qs).length > 0) {
		options.qs = qs;
	}

	if (body !== undefined) {
		options.body = body;
	}

	return (await this.helpers.httpRequestWithAuthentication.call(
		this,
		CREDENTIALS_NAME,
		options,
	)) as InvisibleApiResponse;
}

/**
 * Walks a paginated list endpoint until an empty page comes back. Only the
 * publish jobs list paginates (with `page` / `perPage`) — the organizations
 * and social-accounts endpoints return their full list in one response.
 *
 * Two quirks of the list endpoint shape this loop. A short page is NOT a
 * reliable end signal: the API filters out rows the key's social-account
 * restrictions don't cover after applying the page limit. And pages can
 * overlap: the limit applies to delivery-joined rows, so a job with several
 * deliveries can straddle a page boundary and be returned twice — hence
 * accumulating by ID.
 */
export async function invisibleApiRequestAllItems(
	this: IExecuteFunctions,
	endpoint: string,
	qs: IDataObject = {},
	perPage = 100,
): Promise<IDataObject[]> {
	const collected: IDataObject[] = [];
	const seenIds = new Set<string>();
	const maxPages = 1000;

	for (let page = 1; page <= maxPages; page += 1) {
		const response = (await invisibleApiRequest.call(this, 'GET', endpoint, undefined, {
			...qs,
			page,
			perPage,
		})) as IDataObject[];

		if (!Array.isArray(response) || response.length === 0) {
			return collected;
		}

		for (const entry of response) {
			const id = typeof entry?.id === 'string' ? entry.id : undefined;

			if (id !== undefined) {
				if (seenIds.has(id)) {
					continue;
				}

				seenIds.add(id);
			}

			collected.push(entry);
		}
	}

	// Reaching the cap without seeing an empty page means the end of the list
	// was never confirmed — returning what was collected would silently pass
	// off partial (or, if the API ignored `page`, duplicated) data as complete.
	throw new NodeOperationError(
		this.getNode(),
		`Stopped paginating "${endpoint}" after ${maxPages} pages without reaching the end of the list`,
	);
}
