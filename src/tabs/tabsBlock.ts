import { App, MarkdownPostProcessorContext, MarkdownRenderChild, TFile } from "obsidian";
import type VisagePlugin from "../main";
import { extractVTabsSourceAtLine } from "./extractBlock";
import { openFenceLengthAtLine, parseVTabsBlock, validateOuterFence } from "./parseBlock";
import { renderErrorPanel, renderTabsView, syncTabsView, type TabPanel } from "./renderTabs";

export class TabsBlock extends MarkdownRenderChild {
	private plugin: VisagePlugin;
	private app: App;
	private source: string;
	private blockKey: string;
	private lineStart: number;
	private sourcePath: string;
	private panels: TabPanel[] = [];
	private activeIndex = 0;
	private rootEl: HTMLElement | null = null;

	constructor(
		container: HTMLElement,
		app: App,
		plugin: VisagePlugin,
		source: string,
		blockKey: string,
		lineStart: number,
		sourcePath: string,
	) {
		super(container);
		this.app = app;
		this.plugin = plugin;
		this.source = source;
		this.blockKey = blockKey;
		this.lineStart = lineStart;
		this.sourcePath = sourcePath;
	}

	onload(): void {
		void this.init();
	}

	onunload(): void {
		this.plugin.unregisterTabsBlock(this.blockKey);
	}

	private async init(): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(this.sourcePath);
		if (file instanceof TFile) {
			const fileContent = await this.app.vault.read(file);
			const fullSource = extractVTabsSourceAtLine(fileContent, this.lineStart);
			if (fullSource !== null) this.source = fullSource;

			const openLen = openFenceLengthAtLine(fileContent, this.lineStart);
			if (openLen !== null) {
				const fenceError = validateOuterFence(openLen, this.source);
				if (fenceError) {
					this.renderMessage(fenceError);
					this.plugin.registerTabsBlock(this.blockKey, this);
					await this.plugin.tryApplyPendingTabLink(this.blockKey);
					return;
				}
			}
		}

		this.render();
		this.plugin.registerTabsBlock(this.blockKey, this);
		await this.plugin.tryApplyPendingTabLink(this.blockKey);
	}

	private renderMessage(message: string): void {
		const el = this.containerEl;
		el.empty();
		el.addClass("visage-tabs-block");
		el.setAttr("data-visage-tabs-block-key", this.blockKey);
		renderErrorPanel(el, [message]);
	}

	render(): void {
		const el = this.containerEl;
		el.empty();
		el.addClass("visage-tabs-block");
		el.setAttr("data-visage-tabs-block-key", this.blockKey);

		const parsed = parseVTabsBlock(this.source, this.plugin.settings);
		const errorMessages = parsed.errors.map((e) => `Line ${e.line}: ${e.message}`);

		if (errorMessages.length > 0) {
			renderErrorPanel(el, errorMessages);
			return;
		}

		if (parsed.tabs.length === 0) {
			renderErrorPanel(el, ["No tabs found in this block."]);
			return;
		}

		const cached = this.plugin.getCachedTabIndex(this.blockKey);
		this.activeIndex =
			this.plugin.settings.rememberActiveTab && cached !== undefined
				? Math.min(cached, parsed.tabs.length - 1)
				: 0;

		const host = el.createDiv({ cls: "visage-tabs-host" });
		this.rootEl = host;

		this.panels = renderTabsView(
			host,
			this.app,
			this,
			parsed.tabs,
			this.activeIndex,
			parsed.position,
			parsed.align,
			this.sourcePath,
			(index) => this.setActiveIndex(index),
		);
	}

	setActiveIndex(index: number): void {
		if (!this.rootEl || index < 0 || index >= this.panels.length) return;
		this.activeIndex = index;
		syncTabsView(this.rootEl, this.panels, index);
		if (this.plugin.settings.rememberActiveTab) {
			this.plugin.setCachedTabIndex(this.blockKey, index);
		}
	}
}

export function createTabsBlock(
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext,
	plugin: VisagePlugin,
	source: string,
): TabsBlock {
	el.empty();
	const section = ctx.getSectionInfo(el);
	const lineStart = section?.lineStart ?? 0;
	const blockKey = `${ctx.sourcePath}:${lineStart}`;
	const block = new TabsBlock(el, plugin.app, plugin, source, blockKey, lineStart, ctx.sourcePath);
	ctx.addChild(block);
	return block;
}
