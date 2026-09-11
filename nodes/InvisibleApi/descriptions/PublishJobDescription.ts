import type { INodeProperties } from 'n8n-workflow';

export const publishJobOperations: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['publishJob'] } },
        options: [
            {
                name: 'Cancel',
                value: 'cancel',
                description:
                    'Cancel a scheduled publish job before it dispatches to the provider and release its publishing-limit reservations. Jobs that already dispatched are rejected; cancelling an already cancelled job succeeds unchanged.',
                action: 'Cancel a publish job'
            },
            {
                name: 'Create',
                value: 'create',
                description: 'Start a publish job for one or more connected accounts',
                action: 'Create a publish job'
            },
            {
                name: 'Get',
                value: 'get',
                description: 'Retrieve a single publish job with its delivery state',
                action: 'Get a publish job'
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'Retrieve the publish jobs of an organization',
                action: 'Get many publish jobs'
            },
            {
                name: 'Retry',
                value: 'retry',
                description:
                    'Queue the failed deliveries of a publish job for a safe retry. Deliveries that already reached the provider are rejected to avoid duplicate posts.',
                action: 'Retry a publish job'
            }
        ],
        default: 'create'
    }
];

export const publishJobFields: INodeProperties[] = [
    // ─── create ───────────────────────────────────────────────────────────────
    {
        displayName: 'Target Names or IDs',
        name: 'targets',
        type: 'multiOptions',
        typeOptions: {
            loadOptionsMethod: 'getSocialAccounts',
            loadOptionsDependsOn: ['organizationId']
        },
        required: true,
        default: [],
        description:
            'Connected accounts that should receive the post. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
        displayOptions: { show: { resource: ['publishJob'], operation: ['create'] } }
    },
    {
        displayName: 'Caption',
        name: 'caption',
        type: 'string',
        typeOptions: { rows: 4 },
        default: '',
        description: 'Caption or body text of the post. Max 5000 characters; X limits post text to 280 characters.',
        displayOptions: { show: { resource: ['publishJob'], operation: ['create'] } }
    },
    {
        displayName: 'Media Items',
        name: 'mediaItems',
        placeholder: 'Add Media Item',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true, sortable: true },
        default: {},
        description:
            'Media to attach to the post, up to 10 items. Instagram requires at least one item; X also accepts text-only posts. X posts with several items support up to 4 images and no videos.',
        displayOptions: { show: { resource: ['publishJob'], operation: ['create'] } },
        options: [
            {
                displayName: 'Media Item',
                name: 'item',
                values: [
                    {
                        displayName: 'Alt Text',
                        name: 'altText',
                        type: 'string',
                        default: '',
                        description: 'Alt text to attach to the published media item. Max 5000 characters.'
                    },
                    {
                        displayName: 'Media Type',
                        name: 'mediaType',
                        type: 'options',
                        default: 'auto',
                        options: [
                            {
                                name: 'Auto-Detect From URL',
                                value: 'auto'
                            },
                            {
                                name: 'Image',
                                value: 'image'
                            },
                            {
                                name: 'Video',
                                value: 'video'
                            }
                        ],
                        description:
                            'Detected from the file extension in the Media URL. Set it explicitly when the URL carries no extension, such as a signed CDN link, since detection would otherwise fall back to image.'
                    },
                    {
                        displayName: 'Media URL',
                        name: 'sourceUrl',
                        type: 'string',
                        default: '',
                        placeholder: 'https://storage.example.com/original.jpg',
                        description:
                            'Publicly reachable URL of the image or video. Max 2048 characters. Sent as both the source URL and the provider fetch URL, matching what the InvisibleAPI dashboard submits.'
                    }
                ]
            }
        ]
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['publishJob'], operation: ['create'] } },
        options: [
            {
                displayName: 'Client Request ID',
                name: 'clientRequestId',
                type: 'string',
                default: '',
                placeholder: 'publish-request-2026-05-17-001',
                description:
                    'Idempotency key. Reuse the same value when retrying a request; send a new value to intentionally publish identical content again.'
            },
            {
                displayName: 'First Comment',
                name: 'firstComment',
                type: 'string',
                typeOptions: { rows: 2 },
                default: '',
                description: 'Comment published right after the post. Max 5000 characters.'
            },
            {
                displayName: 'Requested Publish At',
                name: 'requestedPublishAt',
                type: 'dateTime',
                default: '',
                description: 'Future timestamp for scheduled publishing. Leave empty to publish immediately.'
            }
        ]
    },

    // ─── get / retry / cancel ─────────────────────────────────────────────────
    {
        displayName: 'Publish Job ID',
        name: 'publishJobId',
        type: 'string',
        required: true,
        default: '',
        description: 'UUID of the publish job',
        displayOptions: { show: { resource: ['publishJob'], operation: ['cancel', 'get', 'retry'] } }
    },

    // ─── getAll ───────────────────────────────────────────────────────────────
    {
        displayName: 'Return All',
        name: 'returnAll',
        type: 'boolean',
        default: false,
        description: 'Whether to return all results or only up to a given limit',
        displayOptions: { show: { resource: ['publishJob'], operation: ['getAll'] } }
    },
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        typeOptions: { minValue: 1, maxValue: 100 },
        default: 50,
        description: 'Max number of results to return',
        displayOptions: {
            show: { resource: ['publishJob'], operation: ['getAll'], returnAll: [false] }
        }
    },
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
            show: { resource: ['publishJob'], operation: ['getAll'], returnAll: [false] }
        },
        options: [
            {
                displayName: 'Page',
                name: 'page',
                type: 'number',
                typeOptions: { minValue: 1 },
                default: 1,
                description:
                    '1-based page index to fetch. The page limit applies to delivery-joined rows, so a job whose deliveries straddle a page boundary can appear on two consecutive pages.'
            }
        ]
    }
];
