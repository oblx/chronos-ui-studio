import { MCP_MANIFEST } from './mcp.manifest';

export interface JsonRpcRequest {
	readonly jsonrpc?: string;
	readonly id?: string | number | null;
	readonly method: string;
	readonly params?: Record<string, unknown>;
}

export interface RpcSpineConfig<TCtx = undefined> {
	readonly serverName: string;
	readonly toolsMeta: readonly { readonly name: string; readonly description: string }[];
	readonly resourcesMeta?: readonly { readonly uri: string; readonly description: string }[];
	readonly tools: ReadonlyMap<string, (args: Record<string, unknown>, ctx: TCtx) => Promise<unknown>>;
	readonly readResource?: (uri: string) => Promise<unknown>;
}

const RPC_ERR_METHOD = -32601;
const RPC_ERR_EXEC = -32000;

export async function dispatchJsonRpc<TCtx = undefined>(
	req: JsonRpcRequest,
	cfg: RpcSpineConfig<TCtx>,
	ctx: TCtx
) {
	const id = req.id ?? null;
	try {
		if (req.method === 'initialize') {
			return { jsonrpc: '2.0', id, result: { protocolVersion: MCP_MANIFEST.protocolVersion, serverInfo: { name: cfg.serverName, version: MCP_MANIFEST.version } } };
		}
		if (req.method === 'tools/list') return { jsonrpc: '2.0', id, result: { tools: cfg.toolsMeta } };
		if (req.method === 'resources/list' && cfg.resourcesMeta) return { jsonrpc: '2.0', id, result: { resources: cfg.resourcesMeta } };
		if (req.method === 'resources/read' && cfg.readResource) {
			const uri = String(req.params?.uri ?? '');
			return { jsonrpc: '2.0', id, result: { contents: [{ uri, text: JSON.stringify(await cfg.readResource(uri)) }] } };
		}
		if (req.method === 'tools/call') {
			const name = String(req.params?.name ?? '');
			const fn = cfg.tools.get(name);
			if (!fn) return { jsonrpc: '2.0', id, error: { code: RPC_ERR_METHOD, message: `Unknown tool: ${name}` } };
			const output = await fn((req.params?.arguments ?? {}) as Record<string, unknown>, ctx);
			return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(output) }], structured: output } };
		}
		return { jsonrpc: '2.0', id, error: { code: RPC_ERR_METHOD, message: `Unsupported method: ${req.method}` } };
	} catch (err) {
		return { jsonrpc: '2.0', id, error: { code: RPC_ERR_EXEC, message: err instanceof Error ? err.message : `${cfg.serverName} execution failure` } };
	}
}
