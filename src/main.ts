import { MarkdownView, Plugin } from "obsidian";
import { processVisage } from "./process";
import { VisageSettingTab } from "./settings";
import { DEFAULT_SETTINGS, type VisageSettings } from "./types";

export default class VisagePlugin extends Plugin {
	settings: VisageSettings = { ...DEFAULT_SETTINGS };

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new VisageSettingTab(this.app, this));
		this.applyCssVars();

		this.registerMarkdownPostProcessor((el) => {
			processVisage(el, this.settings);
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

	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as Partial<VisageSettings> | null;
		this.settings = { ...DEFAULT_SETTINGS, ...data };
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.rerenderPreviews();
	}
}
