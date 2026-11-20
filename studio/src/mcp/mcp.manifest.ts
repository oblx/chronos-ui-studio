import { VERSION } from '@chronos-ui/svelte';
import { CAPABILITY_BITS } from '../config';
import { listMcpToolDescriptors, probeServerEnvironmentCapabilities } from '../core';
import { listInputConnectors, listOutputAdapters } from '../plugins';

export const MCP_MANIFEST = {
	protocolVersion: '2024-11-05',
	package: '@chronos-ui/svelte',
	version: VERSION,
	capabilityBits: CAPABILITY_BITS,
	spines: {
		builder: {
			endpoint: '/api/mcp',
			stdioCommand: 'bun run mcp:stdio',
			tools: listMcpToolDescriptors(),
			resources: [
				{ uri: 'ui://manifest', description: 'Machine-readable @chronos-ui/svelte component and token manifest.' },
				{ uri: 'ui://tokens/semantic', description: 'Built-in semantic polarity theme packs.' },
				{ uri: 'ui://blueprints/{id}', description: 'Stored blueprint JSON definition by ID.' }
			]
		},
		twin: {
			endpoint: '/api/mcp/twin',
			tools: [
				{ name: 'ui_twin_list_sessions', description: 'List live Studio browser sessions connected to /api/ws/collab.' },
				{ name: 'ui_twin_dispatch_intent', description: 'Dispatch a live DagEnvelope intent to a connected Studio session.' },
				{ name: 'ui_twin_capture_wire_trace', description: 'Capture unified SERVER_DAG telemetry ring records (requires capability bit 28).' }
			]
		}
	}
} as const;

export function getLiveMcpManifest() {
	return {
		...MCP_MANIFEST,
		environment: probeServerEnvironmentCapabilities(),
		connectors: listInputConnectors(),
		adapters: listOutputAdapters()
	};
}
