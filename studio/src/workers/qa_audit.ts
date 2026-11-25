import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { VERSION } from '@chronos-ui/svelte';

export interface AuditViolation { readonly rule: string; readonly target: string; readonly detail: string; }
interface CacheEntry { readonly hash: string; readonly violations: readonly AuditViolation[]; }

const CODE_EXTS = new Set(['.ts', '.svelte', '.js', '.css']);
const EMOJI_RE = /\p{Extended_Pictographic}/u;
const HEX_LITERAL_RE = /#[0-9a-fA-F]{3,8}\b/;
const FN_HEADER_RE = /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)|^\s*const\s+(\w+)\s*=\s*(?:async\s+)?\(/;
const CACHE_REL = 'studio/data/.qa-audit-cache.json';
const HEX_ALLOW_RE = /(?:theme\.palettes|cursor\.presets|\/tokens\/|\/tests\/|sample\.|starter\.|tome\.ssg)/;
const DEEP_RELATIVE_RE = /(?:from|import)\s+['"]\.\.\/\.\./;
const REQUIRED_SUBPATHS = ['./tokens', './wire', './input', './motion', './cursor', './machines', './atoms', './forms', './molecules', './organisms', './modals', './assistant', './canvas'] as const;

function walkTree(dir: string, outFiles: string[], outDirs: string[]): void {
	outDirs.push(dir);
	for (const entry of readdirSync(dir)) {
		if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) continue;
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) walkTree(full, outFiles, outDirs);
		else outFiles.push(full);
	}
}

function checkFunctionLengths(file: string, lines: readonly string[], violations: AuditViolation[]): void {
	if (!file.endsWith('.ts') && !file.endsWith('.svelte')) return;
	for (let i = 0; i < lines.length; i += 1) {
		const m = FN_HEADER_RE.exec(lines[i]);
		if (!m) continue;
		let depth = 0, started = false, end = i;
		for (let j = i; j < lines.length; j += 1) {
			for (const ch of lines[j]) { if (ch === '{') { depth += 1; started = true; } else if (ch === '}') depth -= 1; }
			end = j;
			if (started && depth === 0) break;
		}
		if (started && end - i + 1 > 42) violations.push({ rule: 'FUNCTION_MAX_42_LOC', target: `${file}:${i + 1}`, detail: `${m[1] ?? m[2]} is ${end - i + 1} lines` });
	}
}

function checkCodeFile(file: string, raw: string, violations: AuditViolation[]): void {
	const lines = raw.split('\n');
	if (lines.length > 150) violations.push({ rule: 'CODE_MAX_150_LOC', target: file, detail: `${lines.length} lines` });
	if (EMOJI_RE.test(raw)) violations.push({ rule: 'ZERO_UNICODE_EMOJI', target: file, detail: 'Contains Extended_Pictographic glyph' });
	for (let i = 0; i < lines.length; i += 1) {
		if (/^ +[^\s*]/.test(lines[i])) { violations.push({ rule: 'TABS_ONLY', target: `${file}:${i + 1}`, detail: 'Leading spaces found' }); break; }
	}
	checkFunctionLengths(file, lines, violations);
	if (file.endsWith('.svelte') && /\b(fetch\(|localStorage|indexedDB)\b/.test(raw)) violations.push({ rule: 'HUMBLE_SVELTE_VIEW', target: file, detail: 'Direct I/O call inside .svelte' });
	if (file.endsWith('.svelte') && raw.includes('<svelte:component')) violations.push({ rule: 'SVELTE5_NO_LEGACY_COMPONENT', target: file, detail: 'Legacy <svelte:component> forbidden' });
	if (file.includes('/packages/chronos-ui/') && /from ['"].*studio/.test(raw)) violations.push({ rule: 'PACKAGE_FIREWALL', target: file, detail: 'Upward import into studio/' });
	if (file.endsWith('tooltip.machine.svelte.ts') && /\bsetInterval\s*\(/.test(raw)) violations.push({ rule: 'ZERO_TIMER_TOOLTIP', target: file, detail: 'Forbidden setInterval in tooltip machine' });
	if (!HEX_ALLOW_RE.test(file) && HEX_LITERAL_RE.test(raw)) violations.push({ rule: 'NON_PALETTE_HEX', target: file, detail: 'Hardcoded hex color outside token palettes' });
	if ((file.endsWith('.ts') || file.endsWith('.svelte')) && DEEP_RELATIVE_RE.test(raw)) violations.push({ rule: 'NO_DEEP_RELATIVE_IMPORTS', target: file, detail: 'Multi-level ../.. import forbidden; use @ui/* or @studio/* alias' });
}

function checkSkillFrontmatter(file: string, lines: readonly string[], violations: AuditViolation[]): void {
	if (!file.endsWith('/SKILL.md') || !file.includes('/docs/skills/')) return;
	const endIdx = lines[0]?.trim() === '---' ? lines.findIndex((l, idx) => idx > 0 && l.trim() === '---') : -1;
	if (endIdx < 1) { violations.push({ rule: 'AGENT_SKILLS_SPEC', target: file, detail: 'Missing YAML frontmatter' }); return; }
	const fm = lines.slice(1, endIdx).join('\n');
	const nameMatch = /^name:\s*([a-z0-9-]+)\s*$/m.exec(fm), descMatch = /^description:\s*(.+)$/m.exec(fm);
	const folder = file.split('/').slice(-2, -1)[0];
	if (!nameMatch || nameMatch[1].length > 64 || nameMatch[1] !== folder || nameMatch[1].includes('--')) {
		violations.push({ rule: 'AGENT_SKILLS_SPEC', target: file, detail: `Frontmatter name must match folder "${folder}"` });
	}
	if (!descMatch || !descMatch[1].trim() || descMatch[1].trim().length > 1024) {
		violations.push({ rule: 'AGENT_SKILLS_SPEC', target: file, detail: 'Missing or oversized description (1..1024 chars)' });
	}
}

function checkDocFile(file: string, raw: string, violations: AuditViolation[]): void {
	const lines = raw.split('\n');
	if (lines.length > 100) violations.push({ rule: 'DOC_MAX_100_LOC', target: file, detail: `${lines.length} lines` });
	if (EMOJI_RE.test(raw)) violations.push({ rule: 'ZERO_UNICODE_EMOJI', target: file, detail: 'Contains Extended_Pictographic glyph' });
	if (file.includes('/docs/') && lines.some((l) => l.trim().startsWith('```'))) violations.push({ rule: 'DOC_NO_FENCED_CODE', target: file, detail: 'Fenced code block found' });
	checkSkillFrontmatter(file, lines, violations);
}

function scanCachedFile(file: string, ext: string, rootDir: string, prevCache: Record<string, CacheEntry>, nextCache: Record<string, CacheEntry>, full: boolean): readonly AuditViolation[] {
	const raw = readFileSync(file, 'utf8');
	const hash = createHash('sha256').update(raw).digest('hex');
	const key = relative(rootDir, file);
	const hit = !full ? prevCache[key] : undefined;
	if (hit && hit.hash === hash) { nextCache[key] = hit; return hit.violations; }
	const found: AuditViolation[] = [];
	if (CODE_EXTS.has(ext)) checkCodeFile(file, raw, found);
	if (ext === '.md') checkDocFile(file, raw, found);
	nextCache[key] = { hash, violations: found };
	return found;
}

function checkPackageAndDocs(rootDir: string, violations: AuditViolation[]): void {
	const pkg = JSON.parse(readFileSync(join(rootDir, 'packages/chronos-ui/package.json'), 'utf8'));
	const rootPkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
	const hasSubpaths = REQUIRED_SUBPATHS.every((s) => Boolean(pkg.exports?.[s])) && Boolean(pkg.exports?.['.'] && pkg.exports?.['./manifest'] && pkg.exports?.['./styles.css']) && Array.isArray(pkg.sideEffects) && pkg.sideEffects.includes('*.css');
	const pkgReadme = existsSync(join(rootDir, 'packages/chronos-ui/README.md')) ? readFileSync(join(rootDir, 'packages/chronos-ui/README.md'), 'utf8') : '';
	const hasPublicFiles = pkg.license === 'MIT' && existsSync(join(rootDir, 'LICENSE')) && existsSync(join(rootDir, 'packages/chronos-ui/LICENSE')) && pkgReadme.length > 0 && existsSync(join(rootDir, 'CHANGELOG.md'));
	if (pkg.version !== VERSION || rootPkg.version !== VERSION || Object.keys(pkg.dependencies ?? {}).length > 0 || !hasSubpaths || !hasPublicFiles) {
		violations.push({ rule: 'PACKAGE_LOCK_0_DEPS', target: 'packages/chronos-ui/package.json', detail: `Version parity (${VERSION}), 0 deps, 13 subpaths, MIT license, README, or CHANGELOG failed` });
	}
	const missingDocs = REQUIRED_SUBPATHS.filter((s) => !pkgReadme.includes(s.slice(1)));
	if (missingDocs.length > 0) violations.push({ rule: 'DOCS_AND_SKILL_FRESHNESS', target: 'packages/chronos-ui/README.md', detail: `Undocumented subpaths: ${missingDocs.join(', ')}` });
	const skillsRoot = join(rootDir, 'docs/skills');
	const skillDirs = existsSync(skillsRoot) ? readdirSync(skillsRoot).filter((n) => statSync(join(skillsRoot, n)).isDirectory()) : [];
	const staleSkills = skillDirs.filter((d) => { const p = join(skillsRoot, d, 'SKILL.md'); return !existsSync(p) || !readFileSync(p, 'utf8').includes(`version: "${VERSION}"`); });
	if (skillDirs.length < 5 || staleSkills.length > 0) violations.push({ rule: 'DOCS_AND_SKILL_FRESHNESS', target: 'docs/skills', detail: `Expected >=5 skills at version "${VERSION}", stale: ${staleSkills.join(', ') || 'none'}` });
	const sprintsDir = join(rootDir, 'docs/08-sprints'), archiveDir = join(sprintsDir, 'archive');
	const sprintFiles = [...readdirSync(sprintsDir).filter((n) => n.endsWith('.md')), ...(existsSync(archiveDir) ? readdirSync(archiveDir).filter((n) => n.endsWith('.md')) : [])];
	if (sprintFiles.length < 10) violations.push({ rule: 'SPRINT_ARCHIVE_REQUIRED', target: 'docs/08-sprints', detail: `Found ${sprintFiles.length} sprint logs, expected >= 10` });
}

export function runStaticAudit(rootDir: string = process.cwd(), opts?: { full?: boolean }): AuditViolation[] {
	const violations: AuditViolation[] = [], nearCap: string[] = [], files: string[] = [], dirs: string[] = [];
	checkPackageAndDocs(rootDir, violations);
	for (const sub of ['packages', 'studio', 'docs']) walkTree(join(rootDir, sub), files, dirs);
	for (const d of dirs) {
		const children = readdirSync(d).filter((n) => !n.startsWith('.') && statSync(join(d, n)).isFile());
		if (children.length > 10) violations.push({ rule: 'FOLDER_MAX_10_FILES', target: d, detail: `${children.length} files` });
		else if (children.length >= 9) nearCap.push(`${relative(rootDir, d)} (${children.length}/10)`);
		if ((d.includes('/packages/chronos-ui/src/') || d.includes('/studio/src/')) && children.length > 0 && !children.includes('index.ts')) {
			violations.push({ rule: 'BARREL_INDEX_REQUIRED', target: d, detail: 'Missing index.ts barrel' });
		}
	}
	if (nearCap.length > 0) console.warn(`[audit] NEAR_CAP_WARNING (>=9 files): ${nearCap.join(', ')}`);
	const cachePath = join(rootDir, CACHE_REL);
	const prevCache: Record<string, CacheEntry> = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {};
	const nextCache: Record<string, CacheEntry> = {};
	for (const f of files) {
		const ext = f.includes('.') ? f.slice(f.lastIndexOf('.')) : '';
		if (CODE_EXTS.has(ext) || ext === '.md') violations.push(...scanCachedFile(f, ext, rootDir, prevCache, nextCache, opts?.full ?? false));
	}
	violations.push(...scanCachedFile(join(rootDir, 'README.md'), '.md', rootDir, prevCache, nextCache, opts?.full ?? false));
	try { mkdirSync(join(rootDir, 'studio/data'), { recursive: true }); writeFileSync(cachePath, JSON.stringify(nextCache), 'utf8'); } catch {}
	return violations;
}
