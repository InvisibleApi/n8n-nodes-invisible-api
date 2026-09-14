import { IAuthenticateGeneric, Icon, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

import { BASE_URL_TEST_EXPRESSION, DEFAULT_BASE_URL } from '../nodes/InvisibleApi/transport/baseUrl';

export class InvisibleApi implements ICredentialType {
    name = 'invisibleApi';
    displayName = 'Invisible API';
    icon: Icon = {
        light: 'file:../nodes/InvisibleApi/invisibleApi.svg',
        dark: 'file:../nodes/InvisibleApi/invisibleApi.dark.svg'
    };
    documentationUrl = 'https://api.invisibleapi.ai/public/developer-docs.yaml';
    properties: INodeProperties[] = [
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
            typeOptions: { password: true },
            default: '',
            required: true,
            hint: 'Create an organization API key in the InvisibleAPI dashboard (Organization → API Keys). Keys are scoped per organization.'
        },
        {
            displayName: 'Base URL',
            name: 'baseUrl',
            type: 'string',
            default: DEFAULT_BASE_URL,
            required: true,
            description:
                'Change only when pointing at a staging or self-hosted InvisibleAPI backend. Must be an http or https URL; prefer https, since http sends the API key over the network in cleartext.'
        }
    ];

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                Authorization: '=Bearer {{$credentials.apiKey}}'
            }
        }
    };

    test: ICredentialTestRequest = {
        request: {
            baseURL: BASE_URL_TEST_EXPRESSION,
            url: '/api/v1/organizations',
            method: 'GET'
        }
    };
}
