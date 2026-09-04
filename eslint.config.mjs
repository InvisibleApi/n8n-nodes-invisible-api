import { n8nCommunityNodesPlugin } from '@n8n/eslint-plugin-community-nodes';
import { config } from '@n8n/node-cli/eslint';

const { ignores, plugins, rules } = n8nCommunityNodesPlugin.configs.recommended;

// `@n8n/node-cli` registers its own exact-pinned copy of the plugin, so the
// devDependency version runs only if it replaces that registration.
export default [
    ...config.map((entry) =>
        entry.plugins?.['@n8n/community-nodes'] ? { ...entry, plugins: { ...entry.plugins, ...plugins } } : entry
    ),
    { files: ['**/*.ts', 'package.json'], ignores, rules },
    {
        files: ['package.json'],
        rules: {
            // The overrides field pins qs and uuid to patched releases that their
            // dev-only parents (@n8n/backend-network, @langchain/*) cannot reach
            // in-range. Runtime ships no dependencies, so the field affects the
            // dev toolchain only. Drop the overrides and this exception once the
            // parents update.
            '@n8n/community-nodes/no-overrides-field': 'off'
        }
    }
];
