import { CAPABILITY_BITS } from '../config';

export type StudioRole = 'viewer' | 'editor' | 'admin';

export function hasCapability(mask: number, bit: number): boolean {
	if (bit < 0 || bit > 31) return false;
	return ((mask >>> bit) & 1) === 1;
}

export function grantCapability(mask: number, bit: number): number {
	if (bit < 0 || bit > 31) return mask >>> 0;
	return (mask | (1 << bit)) >>> 0;
}

export function maskForRole(role: StudioRole): number {
	let mask = 1 << CAPABILITY_BITS.READ_BLUEPRINTS;
	if (role === 'editor' || role === 'admin') {
		mask = grantCapability(mask, CAPABILITY_BITS.WRITE_BLUEPRINTS);
		mask = grantCapability(mask, CAPABILITY_BITS.WRITE_THEMES);
	}
	if (role === 'admin') {
		mask = grantCapability(mask, CAPABILITY_BITS.MANAGE_WEBHOOKS);
		mask = grantCapability(mask, CAPABILITY_BITS.ADMIN_WIRE_OBSERVE);
		mask = grantCapability(mask, CAPABILITY_BITS.ADMIN_MCP_TWIN);
	}
	return mask >>> 0;
}
