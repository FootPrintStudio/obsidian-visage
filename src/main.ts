import { MarkdownView, Notice, Plugin } from "obsidian";
import { processVisage } from "./process";
import { VisageSettingTab } from "./settings";
import {
	parseInternalLinkHref,
	resolvePendingTabLink,
	type PendingTabLink,
	type TabLinkTarget,
} from "./tabs/deepLink";
import { formatVTabsBlock, formatVTabsTemplate } from "./tabs/parseBlock";
import { TabsBlock, createTabsBlock } from "./tabs/tabsBlock";
import { DEFAULT_SETTINGS, type VisageSettings } from "./types";

export default class VisagePlugin extends Plugin {
	settings: VisageSettings = { ...DEFAULT_SETTINGS };
	private tabIndexCache = new Map<string, number>();
	private tabsBlocks = new Map<string, TabsBlock>();
	private pendingTabLink: PendingTabLink | null = null;
	private pendingTabTarget: TabLinkTarget | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new VisageSettingTab(this.app, this));
		this.applyCssVars();

		this.registerMarkdownPostProcessor((el) => {
			processVisage(el, this.settings);
		});

		this.registerMarkdownCodeBlockProcessor("v-tabs", (source, el, ctx) => {
			createTabsBlock(el, ctx, this, source);
		});

		this.registerDomEvent(
			document,
			"click",
			(event) => {
				const anchor = (event.target as HTMLElement).closest("a.internal-link");
				if (!anchor) return;
				const parsed = parseInternalLinkHref(anchor.getAttribute("href") ?? "");
				if (!parsed) return;
				this.pendingTabLink = parsed;
				window.setTimeout(() => void this.tryApplyPendingTabLink(), 120);
			},
			{ capture: true },
		);

		this.registerEvent(
			this.app.workspace.on("file-open", () => {
				window.setTimeout(() => void this.tryApplyPendingTabLink(), 120);
			}),
		);

		this.addCommand({
			id: "insert-v-tabs",
			name: "Insert Visage tabs",
			icon: "layout",
			editorCheckCallback: (checking) => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (checking) return Boolean(view?.editor);
				if (!view?.editor) {
					new Notice("Open a note to insert a Visage tabs block.");
					return false;
				}
				const block = formatVTabsBlock(formatVTabsTemplate(this.settings));
				const cursor = view.editor.getCursor();
				view.editor.replaceRange(`${block}\n`, cursor);
				new Notice("Visage tabs block inserted.");
				return true;
			},
		});
	}

	applyCssVars(): void {
		document.body.style.setProperty("--deck-gap", this.settings.deckGap);
		document.body.style.setProperty("--deck-padding", this.settings.deckPadding);
		document.body.style.setProperty("--deck-image-height", this.settings.deckImageHeight);
	}

	rerenderPreviews(): void {
		this.applyCssVars();
		this.app.workspace.iterateAllLeaves((leaf) => {
			const view = leaf.view;
			if (view instanceof MarkdownView) {
				view.previewMode?.rerender(true);
			}
		});
	}

	registerTabsBlock(blockKey: string, block: TabsBlock): void {
		this.tabsBlocks.set(blockKey, block);
		if (this.pendingTabTarget?.blockKey === blockKey || this.pendingTabLink) {
			void this.tryApplyPendingTabLink(blockKey);
		}
	}

	unregisterTabsBlock(blockKey: string): void {
		this.tabsBlocks.delete(blockKey);
	}

	async tryApplyPendingTabLink(forBlockKey?: string): Promise<void> {
		const file = this.app.workspace.getActiveFile();
		if (!file) return;

		let target = this.pendingTabTarget;
		if (!target && this.pendingTabLink) {
			target =
				(await resolvePendingTabLink(this.app, file, this.pendingTabLink, this.settings)) ?? null;
			if (target) {
				this.pendingTabTarget = target;
			} else if (this.tabsBlocks.size > 0) {
				this.pendingTabLink = null;
			}
		}

		if (!target) return;
		if (forBlockKey && target.blockKey !== forBlockKey) return;

		const block = this.tabsBlocks.get(target.blockKey);
		if (!block) return;

		block.setActiveIndex(target.tabIndex);
		this.pendingTabLink = null;
		this.pendingTabTarget = null;
	}

	getCachedTabIndex(blockKey: string): number | undefined {
		return this.tabIndexCache.get(blockKey);
	}

	setCachedTabIndex(blockKey: string, index: number): void {
		this.tabIndexCache.set(blockKey, index);
	}

	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as Partial<VisageSettings> | null;
		this.settings = { ...DEFAULT_SETTINGS, ...data };
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.rerenderPreviews();
	}
}
