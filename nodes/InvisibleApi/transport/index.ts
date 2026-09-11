import type {
    IDataObject,
    IExecuteFunctions,
    IHttpRequestMethods,
    IHttpRequestOptions,
    ILoadOptionsFunctions
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { assertSupportedBaseUrl, normalizeBaseUrl } from './baseUrl';

export const CREDENTIALS_NAME = 'invisibleApi';
export { DEFAULT_BASE_URL } from './baseUrl';

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
    qs?: IDataObject
): Promise<InvisibleApiResponse> {
    const credentials = await this.getCredentials(CREDENTIALS_NAME);
    const baseUrl = normalizeBaseUrl(credentials.baseUrl);
    assertSupportedBaseUrl(this.getNode(), baseUrl);

    const options: IHttpRequestOptions = {
        method,
        url: `${baseUrl}${endpoint}`,
        headers: { Accept: 'application/json' },
        json: true
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
        options
    )) as InvisibleApiResponse;
}

/**
 * One empty page is not the end: the API applies the page limit before dropping
 * rows the key's social-account restrictions don't cover, so a page can come
 * back empty with populated pages behind it. The endpoint returns neither a
 * total count nor a `hasMore` flag, leaving repetition as the only end signal.
 */
const EMPTY_PAGES_BEFORE_END = 3;

/**
 * Walks a paginated list endpoint until it ends. Only the publish jobs list
 * paginates (with `page` / `perPage`) — the organizations and social-accounts
 * endpoints return their full list in one response.
 *
 * Pages can also overlap: the limit applies to delivery-joined rows, so a job
 * with several deliveries can straddle a page boundary and be returned twice —
 * hence accumulating by ID.
 */
export async function invisibleApiRequestAllItems(this: IExecuteFunctions, endpoint: string): Promise<IDataObject[]> {
    const collected: IDataObject[] = [];
    const seenIds = new Set<string>();
    const maxPages = 1000;
    const perPage = 100;
    let emptyPages = 0;

    for (let page = 1; page <= maxPages; page += 1) {
        const response = (await invisibleApiRequest.call(this, 'GET', endpoint, undefined, {
            page,
            perPage
        })) as IDataObject[];

        if (!Array.isArray(response)) {
            return collected;
        }

        if (response.length === 0) {
            emptyPages += 1;
            if (emptyPages >= EMPTY_PAGES_BEFORE_END) {
                return collected;
            }

            continue;
        }

        emptyPages = 0;

        for (const entry of response) {
            const rawId = entry?.id;
            const id = typeof rawId === 'string' || typeof rawId === 'number' ? String(rawId) : undefined;

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
        `Stopped paginating "${endpoint}" after ${maxPages} pages without reaching the end of the list`
    );
}
