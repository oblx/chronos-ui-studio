import { CAPABILITY_BITS } from '@studio/config';
import type { UiDocumentGraph } from './document.tree';

export const GOVERNANCE_LIMITS = {
	maxTreeDepth: 8,
	maxNodeCount: 350
} as const;

export const STUDIO_ROLE_MASKS = {
	VIEWER: 1 << CAPABILITY_BITS.READ_BLUEPRINTS,
	BUILDER: (1 << CAPABILITY_BITS.READ_BLUEPRINTS) | (1 << CAPABILITY_BITS.WRITE_BLUEPRINTS),
	ARCHITECT: (1 << CAPABILITY_BITS.READ_BLUEPRINTS) | (1 << CAPABILITY_BITS.WRITE_BLUEPRINTS) | (1 << CAPABILITY_BITS.WRITE_THEMES),
	ADMIN: (1 << CAPABILITY_BITS.READ_BLUEPRINTS) | (1 << CAPABILITY_BITS.WRITE_BLUEPRINTS) | (1 << CAPABILITY_BITS.WRITE_THEMES)
		| (1 << CAPABILITY_BITS.MANAGE_WEBHOOKS) | (1 << CAPABILITY_BITS.ADMIN_WIRE_OBSERVE) | (1 << CAPABILITY_BITS.ADMIN_MCP_TWIN)
} as const;

export interface GovernanceGateInput {
	readonly graph: UiDocumentGraph;
	readonly actorCapabilityMask: number;
	readonly requiredCapabilityBit: number;
}

export type GovernanceGateResult = { readonly ok: true } | { readonly ok: false; readonly code: string; readonly reason: string };

const UNSAFE_HTML_PATTERN = /<\s*script|javascript:|on[a-z]+\s*=/i;

function computeDepth(graph: UiDocumentGraph, nodeId: string, stack = new Set<string>()): number {
	if (stack.has(nodeId)) throw new Error(`Tree cycle detected at ${nodeId}`);
	const node = graph.nodes[nodeId];
	if (!node || node.childIds.length === 0) return 1;
	stack.add(nodeId);
	let deepest = 1;
	for (const cid of node.childIds) deepest = Math.max(deepest, 1 + computeDepth(graph, cid, stack));
	stack.delete(nodeId);
	return deepest;
}

function hasUnsafeString(value: unknown): boolean {
	if (typeof value === 'string') return UNSAFE_HTML_PATTERN.test(value);
	if (Array.isArray(value)) return value.some(hasUnsafeString);
	if (value && typeof value === 'object') return Object.values(value).some(hasUnsafeString);
	return false;
}

function checkPrototypeCycles(graph: UiDocumentGraph): string | null {
	for (const proto of Object.values(graph.prototypes)) {
		const seen = new Set<string>([proto.id]);
		let cur = proto.basePrototypeId;
		while (cur) {
			if (seen.has(cur)) return `Prototype inheritance cycle detected at ${cur}`;
			seen.add(cur);
			cur = graph.prototypes[cur]?.basePrototypeId;
		}
	}
	return null;
}

export function evaluateGovernanceGate(input: GovernanceGateInput): GovernanceGateResult {
	const needed = 1 << input.requiredCapabilityBit;
	if ((input.actorCapabilityMask & needed) === 0) {
		return { ok: false, code: 'RBAC_DENIED', reason: `Missing capability bit ${input.requiredCapabilityBit}` };
	}
	const allNodes = Object.values(input.graph.nodes);
	if (allNodes.length > GOVERNANCE_LIMITS.maxNodeCount) {
		return { ok: false, code: 'MAX_NODES_EXCEEDED', reason: `Node count ${allNodes.length} exceeds ${GOVERNANCE_LIMITS.maxNodeCount}` };
	}
	const cycleErr = checkPrototypeCycles(input.graph);
	if (cycleErr) return { ok: false, code: 'PROTOTYPE_CYCLE', reason: cycleErr };
	for (const node of allNodes) {
		if (hasUnsafeString(node.label) || hasUnsafeString(node.props)) {
			return { ok: false, code: 'XSS_BLOCKED', reason: `Unsafe markup or script payload in node ${node.id}` };
		}
		if (!node.parentId) {
			try {
				if (computeDepth(input.graph, node.id) > GOVERNANCE_LIMITS.maxTreeDepth) {
					return { ok: false, code: 'MAX_DEPTH_EXCEEDED', reason: `Subtree ${node.id} exceeds max depth ${GOVERNANCE_LIMITS.maxTreeDepth}` };
				}
			} catch (err) {
				return { ok: false, code: 'TREE_CYCLE', reason: err instanceof Error ? err.message : 'Tree cycle detected' };
			}
		}
	}
	return { ok: true };
}
