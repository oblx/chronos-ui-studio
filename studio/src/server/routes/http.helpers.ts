export const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404
} as const;

export const jsonOk = <T>(data: T, status: number = HTTP_STATUS.OK, headers?: HeadersInit): Response =>
	Response.json(data, headers ? { status, headers } : { status });

export const jsonErr = (error: string, status: number = HTTP_STATUS.BAD_REQUEST): Response =>
	Response.json({ error }, { status });

export async function readJsonBody<T>(req: Request, fallback?: T): Promise<T> {
	try {
		return (await req.json()) as T;
	} catch (err) {
		if (fallback !== undefined) return fallback;
		throw err instanceof Error ? err : new Error('Invalid JSON payload');
	}
}

export function parseJsonSafe<T>(raw: string, fallback: T): T {
	try {
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

export const toSlug = (input: string, fallback: string): string =>
	input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || fallback;

export const clampNumber = (v: unknown, fallback: number, min: number, max: number): number => {
	const num = Number(v ?? fallback);
	const safe = Number.isFinite(num) ? num : fallback;
	return Math.max(min, Math.min(max, Math.round(safe)));
};
