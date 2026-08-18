import { App, TFile } from "obsidian";
import { findVTabsBlocksInFile } from "./extractBlock";
import { parseVTabsBlock } from "./parseBlock";
import type { VTabsSettings } from "./types";

export interface PendingTabLink {
	path: string;
	subpath: string;
}

export interface TabLinkTarget {
	blockKey: string;
	tabIndex: number;
}

function slugifyTitle(title: string): string {
	return title
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, "-")
		.replace(/^-+|-+$/g, "");
}

function headingExistsInFile(app: App, file: TFile, heading: string): boolean {
	const cache = app.metadataCache.getFileCache(file);
	return cache?.headings?.some((entry) => entry.heading === heading) ?? false;
}

export async function resolveTabLinkTargetAsync(
	app: App,
	file: TFile,
	subpath: string,
	settings: VTabsSettings,
): Promise<TabLinkTarget | null> {
	const trimmed = subpath.trim();
	if (!trimmed || trimmed.startsWith("^")) return null;

	const fileContent = await app.vault.read(file);
	const blocks = findVTabsBlocksInFile(fileContent);
	if (blocks.length === 0) return null;

	const heading = decodeURIComponent(trimmed.replace(/\+/g, " "));
	if (headingExistsInFile(app, file, heading)) return null;

	for (const block of blocks) {
		const parsed = parseVTabsBlock(block.source, settings);
		const tabIndex = parsed.tabs.findIndex(
			(tab) =>
				tab.title === heading ||
				tab.linkSlug === slugifyTitle(heading) ||
				slugifyTitle(tab.title) === slugifyTitle(heading),
		);
		if (tabIndex === -1) continue;
		return {
			blockKey: `${file.path}:${block.lineStart}`,
			tabIndex,
		};
	}

	return null;
}

export function parseInternalLinkHref(href: string): PendingTabLink | null {
	if (!href) return null;

	const hashIndex = href.indexOf("#");
	if (hashIndex === -1) return null;

	const path = decodeURIComponent(href.slice(0, hashIndex).replace(/^\.\//, ""));
	const subpath = decodeURIComponent(href.slice(hashIndex + 1));
	if (!subpath || subpath.startsWith("^")) return null;

	return { path, subpath };
}

export async function resolvePendingTabLink(
	app: App,
	file: TFile,
	pending: PendingTabLink,
	settings: VTabsSettings,
): Promise<TabLinkTarget | null> {
	const dest = pending.path
		? app.metadataCache.getFirstLinkpathDest(pending.path, file.path)
		: file;
	if (!dest || dest.path !== file.path) return null;
	return resolveTabLinkTargetAsync(app, file, pending.subpath, settings);
}
