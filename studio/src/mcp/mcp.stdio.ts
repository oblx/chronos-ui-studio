import { handleBuilderMcpRpc } from './mcp.builder';
import type { JsonRpcRequest } from './mcp.rpc';

async function runStdioLoop(): Promise<void> {
	const decoder = new TextDecoder();
	const reader = Bun.stdin.stream().getReader();
	let buffer = '';
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split('\n');
		buffer = lines.pop() ?? '';
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed) continue;
			try {
				const req = JSON.parse(trimmed) as JsonRpcRequest;
				const res = await handleBuilderMcpRpc(req);
				process.stdout.write(`${JSON.stringify(res)}\n`);
			} catch {
				process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } })}\n`);
			}
		}
	}
}

if (import.meta.main) {
	void runStdioLoop();
}
