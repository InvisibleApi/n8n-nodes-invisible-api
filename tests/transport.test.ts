import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';

import { invisibleApiRequest, invisibleApiRequestAllItems } from '../nodes/InvisibleApi/transport';
import { testNode } from './fixtures';

function createContext(respond: (options: IHttpRequestOptions) => unknown, baseUrl = 'https://api.example.com') {
    const calls: IHttpRequestOptions[] = [];
    const context = {
        getCredentials: async () => ({ apiKey: 'key', baseUrl }),
        getNode: () => testNode,
        helpers: {
            httpRequestWithAuthentication: async (_credentials: string, options: IHttpRequestOptions) => {
                calls.push(options);
                return respond(options);
            }
        }
    } as unknown as IExecuteFunctions;

    return { context, calls };
}

describe('invisibleApiRequest', () => {
    it('builds the URL from the normalized base URL', async () => {
        const { context, calls } = createContext(() => ({}), ' https://api.example.com/// ');

        await invisibleApiRequest.call(context, 'GET', '/api/v1/organizations');

        expect(calls[0].url).toBe('https://api.example.com/api/v1/organizations');
        expect(calls[0].method).toBe('GET');
    });

    it('omits empty query strings and bodies', async () => {
        const { context, calls } = createContext(() => ({}));

        await invisibleApiRequest.call(context, 'GET', '/x', undefined, {});

        expect(calls[0].qs).toBeUndefined();
        expect(calls[0].body).toBeUndefined();
    });

    it('passes a populated query string and body through', async () => {
        const { context, calls } = createContext(() => ({}));

        await invisibleApiRequest.call(context, 'POST', '/x', { a: 1 }, { page: 2 });

        expect(calls[0].qs).toEqual({ page: 2 });
        expect(calls[0].body).toEqual({ a: 1 });
    });

    it('rejects an unsupported base URL scheme before any request', async () => {
        const { context, calls } = createContext(() => ({}), 'ftp://api.example.com');

        await expect(invisibleApiRequest.call(context, 'GET', '/x')).rejects.toThrow(NodeOperationError);
        expect(calls).toHaveLength(0);
    });
});

describe('invisibleApiRequestAllItems', () => {
    function pagedContext(pages: IDataObject[][]) {
        return createContext((options) => {
            const page = (options.qs as IDataObject).page as number;
            return pages[page - 1] ?? [];
        });
    }

    it('collects pages until the run of empty pages confirms the end', async () => {
        const { context, calls } = pagedContext([[{ id: 'a' }], [{ id: 'b' }]]);

        const items = await invisibleApiRequestAllItems.call(context, '/jobs');

        expect(items).toEqual([{ id: 'a' }, { id: 'b' }]);
        expect(calls).toHaveLength(5);
    });

    it('keeps paginating past a single empty page', async () => {
        const { context } = pagedContext([[{ id: 'a' }], [], [{ id: 'b' }]]);

        const items = await invisibleApiRequestAllItems.call(context, '/jobs');

        expect(items.map((item) => item.id)).toEqual(['a', 'b']);
    });

    it('keeps paginating past two consecutive empty pages', async () => {
        const { context } = pagedContext([[{ id: 'a' }], [], [], [{ id: 'b' }]]);

        const items = await invisibleApiRequestAllItems.call(context, '/jobs');

        expect(items.map((item) => item.id)).toEqual(['a', 'b']);
    });

    it('stops without a request storm when the list is empty from the start', async () => {
        const { context, calls } = pagedContext([]);

        const items = await invisibleApiRequestAllItems.call(context, '/jobs');

        expect(items).toEqual([]);
        expect(calls).toHaveLength(3);
    });

    it('stops when the endpoint stops returning a list', async () => {
        const { context, calls } = createContext(() => ({ message: 'not a list' }));

        const items = await invisibleApiRequestAllItems.call(context, '/jobs');

        expect(items).toEqual([]);
        expect(calls).toHaveLength(1);
    });

    it('drops entries already seen on an earlier page', async () => {
        const { context } = pagedContext([
            [{ id: 'a' }, { id: 'b' }],
            [{ id: 'b' }, { id: 'c' }]
        ]);

        const items = await invisibleApiRequestAllItems.call(context, '/jobs');

        expect(items.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    });

    it('deduplicates numeric IDs too', async () => {
        const { context } = pagedContext([[{ id: 1 }, { id: 2 }], [{ id: 2 }]]);

        const items = await invisibleApiRequestAllItems.call(context, '/jobs');

        expect(items.map((item) => item.id)).toEqual([1, 2]);
    });

    it('keeps entries without a usable ID', async () => {
        const { context } = pagedContext([[{ name: 'x' }, { name: 'x' }]]);

        const items = await invisibleApiRequestAllItems.call(context, '/jobs');

        expect(items).toHaveLength(2);
    });

    it('throws instead of returning unconfirmed data when the page cap is hit', async () => {
        const { context } = createContext((options) => [{ id: `job-${(options.qs as IDataObject).page as number}` }]);

        await expect(invisibleApiRequestAllItems.call(context, '/jobs')).rejects.toThrow(/after 1000 pages/);
    });
});
