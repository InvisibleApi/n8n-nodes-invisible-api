import {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class InvisibleApi implements ICredentialType {
	name = 'invisibleApi';
	displayName = 'Invisible API';
	icon: Icon = {
		light: 'file:../nodes/InvisibleApi/invisibleApi.svg',
		dark: 'file:../nodes/InvisibleApi/invisibleApi.dark.svg',
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
			hint: 'Create an organization API key in the Invisible API dashboard (Organization → API Keys). Keys are scoped per organization.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.invisibleapi.ai',
			required: true,
			description: 'Change only when pointing at a staging or self-hosted Invisible API backend',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			// Mirror the transport's base URL handling: trim, strip trailing
			// slashes and fall back to production when the field is blank.
			baseURL:
				"={{ ($credentials.baseUrl || '').trim().replace(/\\/+$/, '') || 'https://api.invisibleapi.ai' }}",
			url: '/api/v1/organizations',
			method: 'GET',
		},
	};
}
