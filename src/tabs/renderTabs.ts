import { App, Component, MarkdownRenderChild, MarkdownRenderer } from "obsidian";
import { applyTone } from "../parseMarker";
import type { ParsedTab } from "./types";

export class TabPanel extends MarkdownRenderChild {
	private app: App;
	private body: string;
	private sourcePath: string;
	private rendered = false;

	constructor(container: HTMLElement, app: App, body: string, sourcePath: string) {
		super(container);
		this.app = app;
		this.body = body;
		this.sourcePath = sourcePath;
	}

	setActive(active: boolean): void {
		this.containerEl.toggleClass("visage-tabs-panel-active", active);
		if (active && !this.rendered) void this.renderBody();
	}

	async renderBody(): Promise<void> {
		if (this.rendered) return;
		this.containerEl.empty();
		await MarkdownRenderer.render(this.app, this.body, this.containerEl, this.sourcePath, this);
		this.rendered = true;
	}
}

export function renderErrorPanel(container: HTMLElement, messages: string[]): void {
	container.empty();
	container.addClass("visage-tabs-error");
	for (const message of messages) {
		container.createDiv({ cls: "visage-tabs-error-line", text: message });
	}
}

export function renderTabsView(
	container: HTMLElement,
	app: App,
	component: Component,
	tabs: ParsedTab[],
	activeIndex: number,
	position: string,
	align: string,
	sourcePath: string,
	onSelect: (index: number) => void,
): TabPanel[] {
	container.empty();
	container.addClass("visage-tabs-root");
	container.addClass(`visage-tabs-position-${position}`);

	const isHorizontalNav = position === "top" || position === "bottom";
	if (isHorizontalNav) {
		container.addClass(`visage-tabs-nav-align-${align}`);
	}

	const nav = container.createDiv({ cls: "visage-tabs-nav" });
	const navWrap = nav.createDiv({ cls: "visage-tabs-nav-items" });

	const panelsWrap = container.createDiv({ cls: "visage-tabs-panels" });
	const panels: TabPanel[] = [];

	tabs.forEach((tab, index) => {
		const btn = navWrap.createDiv({
			cls: `visage-tabs-nav-item${index === activeIndex ? " is-active" : ""}`,
			attr: {
				role: "tab",
				tabindex: "0",
				"aria-selected": index === activeIndex ? "true" : "false",
			},
		});
		btn.createSpan({ cls: "visage-tabs-nav-label", text: tab.title });
		applyTone(btn, tab.tone);

		const select = (): void => {
			onSelect(index);
		};

		btn.addEventListener("click", (event) => {
			event.preventDefault();
			select();
		});
		btn.addEventListener("keydown", (event) => {
			if (event.key !== "Enter" && event.key !== " ") return;
			event.preventDefault();
			select();
		});

		const panelEl = panelsWrap.createDiv({ cls: "visage-tabs-panel" });
		const panel = new TabPanel(panelEl, app, tab.body, sourcePath);
		component.addChild(panel);
		panel.setActive(index === activeIndex);
		panels.push(panel);
	});

	return panels;
}

export function syncTabsView(root: HTMLElement, panels: TabPanel[], activeIndex: number): void {
	root.querySelectorAll(".visage-tabs-nav-item").forEach((el, index) => {
		el.toggleClass("is-active", index === activeIndex);
		el.setAttr("aria-selected", index === activeIndex ? "true" : "false");
	});
	for (let i = 0; i < panels.length; i++) {
		panels[i]?.setActive(i === activeIndex);
	}
}
