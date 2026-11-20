export type JsonPatchOp =
	| { readonly op: 'add'; readonly path: string; readonly value: unknown }
	| { readonly op: 'remove'; readonly path: string }
	| { readonly op: 'replace'; readonly path: string; readonly value: unknown }
	| { readonly op: 'move'; readonly from: string; readonly path: string }
	| { readonly op: 'copy'; readonly from: string; readonly path: string }
	| { readonly op: 'test'; readonly path: string; readonly value: unknown };

export interface PatchExecutionResult<T> {
	readonly doc: T;
	readonly inverse: readonly JsonPatchOp[];
}

function decodePointer(path: string): string[] {
	if (path === '' || path === '/') return [];
	if (!path.startsWith('/')) throw new Error(`Invalid JSON pointer: ${path}`);
	return path.slice(1).split('/').map((seg) => seg.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function deepClone<T>(val: T): T {
	return structuredClone(val);
}

function deepEqual(a: unknown, b: unknown): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

function resolveParent(root: unknown, tokens: readonly string[]): { parent: Record<string, unknown> | unknown[]; key: string } {
	let cur = root;
	for (let i = 0; i < tokens.length - 1; i += 1) {
		const seg = tokens[i];
		if (!cur || typeof cur !== 'object') throw new Error(`Pointer traversal failed at ${seg}`);
		cur = Array.isArray(cur) ? cur[Number(seg)] : (cur as Record<string, unknown>)[seg];
	}
	if (!cur || typeof cur !== 'object') throw new Error('Target parent is not a container');
	return { parent: cur as Record<string, unknown> | unknown[], key: tokens[tokens.length - 1] };
}

function getAtPointer(root: unknown, path: string): unknown {
	const tokens = decodePointer(path);
	let cur = root;
	for (const seg of tokens) {
		if (!cur || typeof cur !== 'object') throw new Error(`Missing path: ${path}`);
		cur = Array.isArray(cur) ? cur[Number(seg)] : (cur as Record<string, unknown>)[seg];
	}
	return cur;
}

function applyAdd(root: unknown, path: string, value: unknown): JsonPatchOp {
	const tokens = decodePointer(path);
	const { parent, key } = resolveParent(root, tokens);
	if (Array.isArray(parent)) {
		const idx = key === '-' ? parent.length : Number(key);
		parent.splice(idx, 0, deepClone(value));
		const actualPath = key === '-' ? `${path.slice(0, -1)}${idx}` : path;
		return { op: 'remove', path: actualPath };
	}
	const existed = Object.prototype.hasOwnProperty.call(parent, key);
	const prev = existed ? deepClone(parent[key]) : undefined;
	parent[key] = deepClone(value);
	return existed ? { op: 'replace', path, value: prev } : { op: 'remove', path };
}

function applyRemove(root: unknown, path: string): { removed: unknown; inverse: JsonPatchOp } {
	const tokens = decodePointer(path);
	const { parent, key } = resolveParent(root, tokens);
	if (Array.isArray(parent)) {
		const idx = Number(key);
		const [removed] = parent.splice(idx, 1);
		return { removed, inverse: { op: 'add', path, value: deepClone(removed) } };
	}
	const removed = deepClone(parent[key]);
	delete parent[key];
	return { removed, inverse: { op: 'add', path, value: removed } };
}

function applySingleOp(root: unknown, op: JsonPatchOp, inverse: JsonPatchOp[]): void {
	if (op.op === 'add') {
		inverse.unshift(applyAdd(root, op.path, op.value));
	} else if (op.op === 'remove') {
		inverse.unshift(applyRemove(root, op.path).inverse);
	} else if (op.op === 'replace') {
		const prev = deepClone(getAtPointer(root, op.path));
		const { parent, key } = resolveParent(root, decodePointer(op.path));
		if (Array.isArray(parent)) parent[Number(key)] = deepClone(op.value);
		else parent[key] = deepClone(op.value);
		inverse.unshift({ op: 'replace', path: op.path, value: prev });
	} else if (op.op === 'move') {
		const { removed, inverse: rmInv } = applyRemove(root, op.from);
		const addInv = applyAdd(root, op.path, removed);
		inverse.unshift(rmInv);
		inverse.unshift(addInv);
	} else if (op.op === 'copy') {
		const copied = deepClone(getAtPointer(root, op.from));
		inverse.unshift(applyAdd(root, op.path, copied));
	} else if (op.op === 'test') {
		const actual = getAtPointer(root, op.path);
		if (!deepEqual(actual, op.value)) throw new Error(`RFC 6902 test failed at ${op.path}`);
	}
}

export function applyJsonPatchWithInverse<T>(document: T, patches: readonly JsonPatchOp[]): PatchExecutionResult<T> {
	const next = deepClone(document);
	const inverse: JsonPatchOp[] = [];
	for (const op of patches) applySingleOp(next, op, inverse);
	return { doc: next, inverse };
}
