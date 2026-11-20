import type { IntentKind } from '@chronos-ui/svelte';
import { CAPABILITY_BITS } from '../config';
import { hasCapability } from '../core';
import type { AuthPrincipal } from '../server/auth.middleware';
import { getServerTraces } from '../server/server.telemetry';
import { dispatchTwinIntentToSession, listCollabSessions } from '../server/ws.collab';
import { MCP_MANIFEST } from './mcp.manifest';
import { dispatchJsonRpc, type JsonRpcRequest } from './mcp.rpc';

type TwinToolFn = (args: Record<string, unknown>, principal: AuthPrincipal | null) => Promise<unknown>;

const twinTools = new Map<string, TwinToolFn>([
	['ui_twin_list_sessions', async () => ({ sessions: listCollabSessions() })],
	['ui_twin_dispatch_intent', async (args) => {
		const sessionId = String(args.sessionId ?? listCollabSessions()[0]?.sessionId ?? '');
		const kind = String(args.kind ?? 'UI_TOGGLE_POLARITY') as IntentKind;
		const payload = (args.payload ?? {}) as Record<string, unknown>;
		if (!sessionId) throw new Error('No active Studio session connected.');
		const delivered = dispatchTwinIntentToSession(sessionId, kind, payload);
		return { delivered, sessionId, kind };
	}],
	['ui_twin_capture_wire_trace', async (_args, principal) => {
		if (principal && !hasCapability(principal.capabilityMask, CAPABILITY_BITS.ADMIN_WIRE_OBSERVE)) {
			throw new Error('Capability bit 28 (ADMIN_WIRE_OBSERVE) required.');
		}
		if (!principal && process.env.DEVMODE !== 'true') {
			throw new Error('Authentication with capability bit 28 required.');
		}
		return { traces: getServerTraces() };
	}]
]);

export function handleTwinMcpRpc(req: JsonRpcRequest, principal: AuthPrincipal | null) {
	return dispatchJsonRpc(req, {
		serverName: 'chronos-twin-mcp',
		toolsMeta: MCP_MANIFEST.spines.twin.tools,
		tools: twinTools
	}, principal);
}
