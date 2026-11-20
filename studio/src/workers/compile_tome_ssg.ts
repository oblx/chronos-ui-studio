import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface TomeInlineToken { readonly kind: 'text' | 'code' | 'strong' | 'em' | 'math'; readonly text: string; }

export type TomeBlock =
	| { readonly kind: 'heading'; readonly level: 2 | 3; readonly text: string }
	| { readonly kind: 'paragraph'; readonly tokens: readonly TomeInlineToken[] }
	| { readonly kind: 'list'; readonly ordered: boolean; readonly items: readonly (readonly TomeInlineToken[])[] }
	| { readonly kind: 'table'; readonly headers: readonly (readonly TomeInlineToken[])[]; readonly rows: readonly (readonly (readonly TomeInlineToken[])[])[] }
	| { readonly kind: 'blockquote'; readonly tokens: readonly TomeInlineToken[] };

export interface TomeFolioPage { readonly index: number; readonly heading: string; readonly blocks: readonly TomeBlock[]; }
export interface TomeChapterFormula { readonly lhs: string; readonly operator: string; readonly rhs: string; readonly label: string; }
export interface TomeChapter {
	readonly id: string; readonly slug: string; readonly number: number; readonly title: string;
	readonly contextTopic: string; readonly summary: string; readonly keyFormula: TomeChapterFormula; readonly pages: readonly TomeFolioPage[];
}

const DOCS_DIR = join(process.cwd(), 'docs');
const OUT_FILE = join(process.cwd(), 'studio/src/config/tome.ssg.ts');
const TOPIC_MAP: Record<string, string> = {
	'01_architecture': 'composer', '02_wireframe_zones': 'stage', '03_tokens_and_geometry': 'theme',
	'04_event_dag_and_wire': 'wire', '05_mcp_and_agents': 'mcp', '06_quickstart_5min': 'composer'
};
const FORMULA_MAP: Record<string, TomeChapterFormula> = {
	'01_architecture': { lhs: 'LoC_{fn}', operator: '<=', rhs: '42', label: 'Humble View Cap' },
	'02_wireframe_zones': { lhs: 'W_{safe}', operator: '=', rhs: 'W_{vp} - 2G_{rail}', label: 'Safe Corridor Width' },
	'03_tokens_and_geometry': { lhs: 'C_{wcag}', operator: '>=', rhs: '4.5', label: 'Luminance Contrast' },
	'04_event_dag_and_wire': { lhs: 'HLC_{t}', operator: '>', rhs: 'HLC_{t-1}', label: 'Monotonic Event DAG' },
	'05_mcp_and_agents': { lhs: 'P_{parity}', operator: '=', rhs: 'T_{human} = T_{agent}', label: 'Dual-Spine Parity' },
	'06_quickstart_5min': { lhs: 'T_{sprint}', operator: '<=', rhs: '25m', label: 'Velocity Budget' }
};

export function parseInlineTokens(input: string): TomeInlineToken[] {
	const out: TomeInlineToken[] = [];
	const re = /(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$|\*[^*\s][^*]*\*)/g;
	let last = 0;
	for (const m of input.matchAll(re)) {
		const idx = m.index ?? 0;
		if (idx > last) out.push({ kind: 'text', text: input.slice(last, idx) });
		const raw = m[0];
		if (raw.startsWith('**')) out.push({ kind: 'strong', text: raw.slice(2, -2) });
		else if (raw.startsWith('`')) out.push({ kind: 'code', text: raw.slice(1, -1) });
		else if (raw.startsWith('$')) out.push({ kind: 'math', text: raw.slice(1, -1) });
		else out.push({ kind: 'em', text: raw.slice(1, -1) });
		last = idx + raw.length;
	}
	if (last < input.length) out.push({ kind: 'text', text: input.slice(last) });
	return out.length > 0 ? out : [{ kind: 'text', text: input }];
}

const cleanPlain = (s: string): string => s.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`/g, '');
const splitTableRow = (line: string): readonly (readonly TomeInlineToken[])[] =>
	line.replace(/^\||\|$/g, '').split('|').map((cell) => parseInlineTokens(cell.trim()));

function parseBlocks(lines: readonly string[]): { title: string; summary: string; blocks: TomeBlock[] } {
	let title = 'Chapter';
	let summary = '';
	const blocks: TomeBlock[] = [];
	for (let i = 0; i < lines.length; i += 1) {
		const t = lines[i].trim();
		if (!t) continue;
		if (t.startsWith('# ')) { title = cleanPlain(t.slice(2).trim()); continue; }
		if (t.startsWith('## ') || t.startsWith('### ')) { blocks.push({ kind: 'heading', level: t.startsWith('### ') ? 3 : 2, text: cleanPlain(t.replace(/^#{2,3}\s+/, '')) }); continue; }
		if (t.startsWith('> ')) { blocks.push({ kind: 'blockquote', tokens: parseInlineTokens(t.slice(2).trim()) }); continue; }
		if (t.startsWith('|') && lines[i + 1]?.trim().startsWith('|---')) {
			const headers = splitTableRow(t);
			const rows: (readonly (readonly TomeInlineToken[])[])[] = [];
			for (i += 2; i < lines.length && lines[i].trim().startsWith('|'); i += 1) rows.push(splitTableRow(lines[i].trim()));
			i -= 1; blocks.push({ kind: 'table', headers, rows }); continue;
		}
		if (/^([-*]|\d+\.)\s+/.test(t)) {
			const ordered = /^\d+\.\s+/.test(t);
			const items: (readonly TomeInlineToken[])[] = [];
			for (; i < lines.length && (ordered ? /^\d+\.\s+/.test(lines[i].trim()) : /^[-*]\s+/.test(lines[i].trim())); i += 1) {
				items.push(parseInlineTokens(lines[i].trim().replace(/^([-*]|\d+\.)\s+/, '')));
			}
			i -= 1; blocks.push({ kind: 'list', ordered, items }); continue;
		}
		if (!summary && blocks.length === 0) { summary = cleanPlain(t); continue; }
		blocks.push({ kind: 'paragraph', tokens: parseInlineTokens(t) });
	}
	return { title, summary: summary || title, blocks };
}

function paginateBlocks(blocks: readonly TomeBlock[], fallbackTitle: string): TomeFolioPage[] {
	const pages: TomeFolioPage[] = [];
	let curBlocks: TomeBlock[] = [];
	let curHeading = fallbackTitle;
	for (const block of blocks) {
		if (block.kind === 'heading' && curBlocks.length >= 2) { pages.push({ index: pages.length, heading: curHeading, blocks: curBlocks }); curBlocks = []; }
		if (block.kind === 'heading') curHeading = block.text;
		curBlocks.push(block);
		if (curBlocks.length >= 4) { pages.push({ index: pages.length, heading: curHeading, blocks: curBlocks }); curBlocks = []; }
	}
	if (curBlocks.length > 0 || pages.length === 0) pages.push({ index: pages.length, heading: curHeading, blocks: curBlocks });
	return pages;
}

export function parseMarkdownChapter(slug: string, raw: string, num = 1): TomeChapter {
	const lines = raw.split('\n');
	if (lines.length > 100) throw new Error(`Doc ${slug}.md exceeds 100 LoC (${lines.length}).`);
	if (lines.some((l) => l.trim().startsWith('```'))) throw new Error(`Doc ${slug}.md contains forbidden fenced code block.`);
	const { title, summary, blocks } = parseBlocks(lines);
	return {
		id: slug, slug, number: num, title, contextTopic: TOPIC_MAP[slug] ?? 'composer',
		summary, keyFormula: FORMULA_MAP[slug] ?? FORMULA_MAP['01_architecture'],
		pages: paginateBlocks(blocks, title.replace(/^Chapter\s+\d+:\s*/i, ''))
	};
}

export function compileTomeSsg(): readonly TomeChapter[] {
	const files = readdirSync(DOCS_DIR).filter((f) => /^\d+_.*\.md$/.test(f)).sort();
	const chapters = files.map((file, idx) => parseMarkdownChapter(file.replace(/\.md$/, ''), readFileSync(join(DOCS_DIR, file), 'utf8'), idx + 1));
	const body = chapters.map((c) => `\t${JSON.stringify(c)}`).join(',\n');
	const out = `import type { TomeChapter } from '../workers/compile_tome_ssg';\nexport type { TomeBlock, TomeChapter, TomeChapterFormula, TomeFolioPage, TomeInlineToken } from '../workers/compile_tome_ssg';\n\nexport const TOME_SSG_CHAPTERS: readonly TomeChapter[] = [\n${body}\n] as const;\n`;
	writeFileSync(OUT_FILE, out, 'utf8');
	return chapters;
}

if (import.meta.main) {
	const chapters = compileTomeSsg();
	console.log(`[build:tome] Compiled ${chapters.length} AST chapters -> studio/src/config/tome.ssg.ts`);
}
