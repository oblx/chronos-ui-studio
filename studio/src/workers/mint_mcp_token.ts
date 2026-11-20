import { STUDIO_CONFIG } from '../config';
import { grantCapability, maskForRole } from '../core';
import { getStudioDb, hashToken, mcpTokens } from '../lib';

function parseArg(flag: string, fallback: string): string {
	const eqPrefix = `${flag}=`;
	const eqMatch = process.argv.find((a) => a.startsWith(eqPrefix));
	if (eqMatch) return eqMatch.slice(eqPrefix.length);
	const idx = process.argv.indexOf(flag);
	return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

export async function mintCliMcpToken(label: string, extraCapBit?: number) {
	const db = await getStudioDb();
	let mask = maskForRole('admin');
	if (typeof extraCapBit === 'number' && !Number.isNaN(extraCapBit)) {
		mask = grantCapability(mask, extraCapBit);
	}
	const rawToken = `${STUDIO_CONFIG.tokenPrefix}${crypto.randomUUID().replace(/-/g, '')}`;
	await db.insert(mcpTokens).values({
		id: `pat-${Date.now().toString(36)}`,
		userId: STUDIO_CONFIG.devSeed.ownerId,
		label: label.slice(0, STUDIO_CONFIG.maxTokenLabelLength),
		tokenHash: hashToken(rawToken),
		capabilityMask: mask,
		createdAt: Date.now()
	});
	return { token: rawToken, label, capabilityMask: mask };
}

if (import.meta.main) {
	const label = parseArg('--label', 'cli-agent');
	const capArg = parseArg('--caps', '');
	const bit = capArg ? Number.parseInt(capArg, 10) : undefined;
	void mintCliMcpToken(label, bit).then((res) => {
		console.log(JSON.stringify(res));
	});
}
