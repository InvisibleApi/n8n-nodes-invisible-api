import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { executeInsights } from './actions/insights';
import { executeOrganization } from './actions/organization';
import { executePublishJob } from './actions/publishJob';
import { executeSocialAccount } from './actions/socialAccount';
import { organizationIdField } from './descriptions/common';
import { insightsFields, insightsOperations } from './descriptions/InsightsDescription';
import { organizationFields, organizationOperations } from './descriptions/OrganizationDescription';
import { publishJobFields, publishJobOperations } from './descriptions/PublishJobDescription';
import {
	socialAccountFields,
	socialAccountOperations,
} from './descriptions/SocialAccountDescription';
import {
	getInstagramSocialAccounts,
	getOrganizations,
	getSocialAccounts,
} from './methods/loadOptions';

type ResourceHandler = (
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
) => Promise<IDataObject[]>;

/**
 * One entry per resource. Adding a provider or feature (Facebook publishing,
 * further social platform integrations, …) means adding a description module, an
 * action module and one line here.
 */
const RESOURCE_HANDLERS: Record<string, ResourceHandler> = {
	organization: executeOrganization,
	socialAccount: executeSocialAccount,
	publishJob: executePublishJob,
	insights: executeInsights,
};

export class InvisibleApi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'InvisibleAPI',
		name: 'invisibleApi',
		icon: { light: 'file:invisibleApi.svg', dark: 'file:invisibleApi.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Publish content and read insights through the InvisibleAPI',
		defaults: { name: 'InvisibleAPI' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'invisibleApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Insight', value: 'insights' },
					{ name: 'Organization', value: 'organization' },
					{ name: 'Publish Job', value: 'publishJob' },
					{ name: 'Social Account', value: 'socialAccount' },
				],
				default: 'publishJob',
			},

			...organizationOperations,
			...socialAccountOperations,
			...publishJobOperations,
			...insightsOperations,

			organizationIdField,

			...organizationFields,
			...socialAccountFields,
			...publishJobFields,
			...insightsFields,
		],
	};

	methods = {
		loadOptions: {
			getInstagramSocialAccounts,
			getOrganizations,
			getSocialAccounts,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const resource = this.getNodeParameter('resource', itemIndex) as string;
			const operation = this.getNodeParameter('operation', itemIndex) as string;

			try {
				const handler = RESOURCE_HANDLERS[resource];
				if (handler === undefined) {
					throw new NodeOperationError(
						this.getNode(),
						`The resource "${resource}" is not supported`,
						{ itemIndex },
					);
				}

				const results = await handler.call(this, operation, itemIndex);

				returnData.push(
					...results.map((json) => ({
						json,
						pairedItem: { item: itemIndex },
					})),
				);
			} catch (error) {
				const nodeError =
					error instanceof NodeOperationError || error instanceof NodeApiError
						? error
						: new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });

				if (this.continueOnFail()) {
					returnData.push({
						json: { error: nodeError.message },
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				throw nodeError;
			}
		}

		return [returnData];
	}
}
