import type { ServerWebSocket } from 'bun';
import type { IntentKind } from '@chronos-ui/svelte';
import { pushServerTrace } from './server.telemetry';

export interface CollabSessionInfo {
	readonly sessionId: string;
	readonly label: string;
	readonly x: number;
	readonly y: number;
	readonly scope: 'WORKSPACE' | 'FULL_APP';
	readonly lastSeenAt: number;
}

export interface QueuedTwinCommand {
	readonly id: string;
	readonly kind: IntentKind;
	readonly payload: Record<string, unknown>;
	readonly issuedAt: number;
}

interface WsSocketData {
	sessionId: string;
}

const activeSessions = new Map<string, CollabSessionInfo>();
const liveSockets = new Map<string, ServerWebSocket<WsSocketData>>();
const commandQueues = new Map<string, QueuedTwinCommand[]>();

export function listCollabSessions(): readonly CollabSessionInfo[] {
	const cutoff = Date.now() - 45_000;
	for (const [id, info] of activeSessions.entries()) {
		if (info.lastSeenAt < cutoff && !liveSockets.has(id)) {
			activeSessions.delete(id);
			commandQueues.delete(id);
		}
	}
	return Array.from(activeSessions.values());
}

export function dispatchTwinIntentToSession(
	sessionId: string,
	kind: IntentKind,
	payload: Record<string, unknown>
): boolean {
	const cmd: QueuedTwinCommand = {
		id: `twin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
		kind,
		payload,
		issuedAt: Date.now()
	};
	const ws = liveSockets.get(sessionId);
	if (ws) {
		ws.send(JSON.stringify({ type: 'TWIN_INTENT', command: cmd }));
	}
	const q = commandQueues.get(sessionId) ?? [];
	q.push(cmd);
	commandQueues.set(sessionId, q.slice(-32));
	pushServerTrace(kind, `Twin dispatched to ${sessionId}`, 0.4, true, 'MCP_TWIN', 'TIER_2_REALTIME_CLUSTER');
	return activeSessions.has(sessionId) || Boolean(ws);
}

export function handleCollabHttp(req: Request, path: string): Promise<Response> | Response | null {
	if (path !== '/api/ws/collab') return null;
	if (req.method === 'GET') {
		const url = new URL(req.url);
		const sid = url.searchParams.get('sessionId') ?? '';
		const pending = sid ? (commandQueues.get(sid) ?? []) : [];
		if (sid) commandQueues.set(sid, []);
		return Response.json({ peers: listCollabSessions(), commands: pending });
	}
	if (req.method === 'POST') {
		return req.json().then((body) => {
			const data = body as Partial<CollabSessionInfo>;
			const sessionId = String(data.sessionId ?? '').trim();
			if (!sessionId) return Response.json({ error: 'sessionId required' }, { status: 400 });
			activeSessions.set(sessionId, {
				sessionId,
				label: String(data.label ?? 'Studio Peer').slice(0, 32),
				x: Number(data.x ?? 200),
				y: Number(data.y ?? 200),
				scope: data.scope === 'FULL_APP' ? 'FULL_APP' : 'WORKSPACE',
				lastSeenAt: Date.now()
			});
			const pending = commandQueues.get(sessionId) ?? [];
			commandQueues.set(sessionId, []);
			return Response.json({ peers: listCollabSessions(), commands: pending });
		});
	}
	return null;
}

export const collabWebsocketHandlers = {
	open(ws: ServerWebSocket<WsSocketData>): void {
		const sid = ws.data.sessionId;
		liveSockets.set(sid, ws);
		activeSessions.set(sid, {
			sessionId: sid,
			label: `Session ${sid.slice(-4)}`,
			x: 240,
			y: 240,
			scope: 'WORKSPACE',
			lastSeenAt: Date.now()
		});
	},
	message(ws: ServerWebSocket<WsSocketData>, raw: string | Buffer): void {
		const sid = ws.data.sessionId;
		try {
			const msg = JSON.parse(String(raw)) as { type?: string; x?: number; y?: number; label?: string; scope?: 'WORKSPACE' | 'FULL_APP' };
			if (msg.type === 'CURSOR') {
				activeSessions.set(sid, {
					sessionId: sid,
					label: String(msg.label ?? `Session ${sid.slice(-4)}`),
					x: Number(msg.x ?? 0),
					y: Number(msg.y ?? 0),
					scope: msg.scope === 'FULL_APP' ? 'FULL_APP' : 'WORKSPACE',
					lastSeenAt: Date.now()
				});
			}
		} catch {
			// Ignore malformed client WS frame
		}
	},
	close(ws: ServerWebSocket<WsSocketData>): void {
		liveSockets.delete(ws.data.sessionId);
	}
};
