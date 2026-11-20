import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { TomeChapter } from '../config';

const DOCS_DIR = join(process.cwd(), 'docs');
const OUT_FILE = join(process.cwd(), 'studio/src/config/tome.ssg.ts');

const TOPIC_MAP: Record<string, string> = {
	'01_architecture': 'composer',
	'02_wireframe_zones': 'stage',
	'03_tokens_and_geometry': 'theme',
	'04_event_dag_and_wire': 'wire',
	'05_mcp_and_agents': 'mcp',
	'06_quickstart_5min': 'composer'
};

function parseMarkdownChapter(slug: string, raw: string): TomeChapter {
	const lines = raw.split('\n');
	if (lines.length > 100) throw new Error(`Doc ${slug}.md exceeds 100 LoC (${lines.length}).`);
	if (lines.some((l) => l.trim().startsWith('```'))) {
		throw new Error(`Doc ${slug}.md contains forbidden fenced code block.`);
	}
	let title = slug;
	const sections: { heading: string; paragraphs: string[] }[] = [];
	let currentHeading = 'Overview';
	let currentParagraphs: string[] = [];

	const flush = (): void => {
		if (currentParagraphs.length > 0) {
			sections.push({ heading: currentHeading, paragraphs: currentParagraphs });
			currentParagraphs = [];
		}
	};

	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.startsWith('# ')) {
			title = trimmed.slice(2).trim();
		} else if (trimmed.startsWith('## ')) {
			flush();
			currentHeading = trimmed.slice(3).trim();
		} else if (trimmed.length > 0) {
			currentParagraphs.push(trimmed.replace(/^[-*\d.]+\s+/, ''));
		}
	}
	flush();
	return {
		id: slug,
		slug,
		title,
		contextTopic: TOPIC_MAP[slug] ?? 'composer',
		summary: sections[0]?.paragraphs[0] ?? title,
		sections
	};
}

export function compileTomeSsg(): readonly TomeChapter[] {
	const files = readdirSync(DOCS_DIR)
		.filter((f) => f.endsWith('.md'))
		.sort();
	const chapters = files.map((file) => {
		const slug = file.replace(/\.md$/, '');
		return parseMarkdownChapter(slug, readFileSync(join(DOCS_DIR, file), 'utf8'));
	});
	const body = chapters.map((c) => `\t${JSON.stringify(c)}`).join(',\n');
	const content = [
		`export interface TomeChapter {`,
		`\treadonly id: string;`,
		`\treadonly slug: string;`,
		`\treadonly title: string;`,
		`\treadonly contextTopic: string;`,
		`\treadonly summary: string;`,
		`\treadonly sections: readonly { readonly heading: string; readonly paragraphs: readonly string[] }[];`,
		`}`,
		``,
		`export const TOME_SSG_CHAPTERS: readonly TomeChapter[] = [`,
		body,
		`] as const;`,
		``
	].join('\n');
	writeFileSync(OUT_FILE, content, 'utf8');
	return chapters;
}

if (import.meta.main) {
	const chapters = compileTomeSsg();
	console.log(`[build:tome] Compiled ${chapters.length} SSG chapters -> studio/src/config/tome.ssg.ts`);
}
