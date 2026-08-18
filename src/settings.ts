import { Component, PluginSettingTab, Setting } from "obsidian";
import type VisagePlugin from "./main";
import {
	renderGuidePanel,
	renderReadmePanel,
	renderSettingsTabBar,
	type PluginSettingsTabId,
} from "./readmeTab";

export class VisageSettingTab extends PluginSettingTab {
	plugin: VisagePlugin;
	private activeTab: PluginSettingsTabId = "settings";
	private readmeComponent = new Component();

	constructor(app: VisagePlugin["app"], plugin: VisagePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	hide(): void {
		this.readmeComponent.unload();
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		this.readmeComponent.unload();
		this.readmeComponent = new Component();

		containerEl.createEl("h2", { text: "Visage" });

		const tabBar = containerEl.createDiv();
		renderSettingsTabBar(tabBar, this.activeTab, (tab) => {
			this.activeTab = tab;
			this.display();
		}, "visage");

		const content = containerEl.createDiv({ cls: "visage-settings-content" });
		const pluginDir =
			this.plugin.manifest.dir ??
			`${this.app.vault.configDir}/plugins/${this.plugin.manifest.id}`;

		if (this.activeTab === "readme") {
			renderReadmePanel(this.app, content, this.readmeComponent, "visage-readme-panel", pluginDir);
			return;
		}

		if (this.activeTab === "guide") {
			renderGuidePanel(this.app, content, this.readmeComponent, "visage-guide-panel", pluginDir);
			return;
		}

		this.displaySettings(content);
	}

	private displaySettings(containerEl: HTMLElement): void {
		containerEl.createEl("p", {
			text: "Reading view only. Mark list items with a leading `v-card` inline code token. Disable the ListDecks CSS snippet on notes that use Visage so styles do not double-apply.",
		});

		new Setting(containerEl)
			.setName("Card gap")
			.setDesc("Space between cards (`--deck-gap`). Default 0.35rem.")
			.addText((text) =>
				text
					.setPlaceholder("0.35rem")
					.setValue(this.plugin.settings.deckGap)
					.onChange(async (value) => {
						const next = value.trim() || "0.35rem";
						this.plugin.settings.deckGap = next;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Card padding")
			.setDesc("Inner padding scale (`--deck-padding`). Default 0.65em.")
			.addText((text) =>
				text
					.setPlaceholder("0.65em")
					.setValue(this.plugin.settings.deckPadding)
					.onChange(async (value) => {
						const next = value.trim() || "0.65em";
						this.plugin.settings.deckPadding = next;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Image height")
			.setDesc("Max image height inside cards (`--deck-image-height`). Default 800px.")
			.addText((text) =>
				text
					.setPlaceholder("800px")
					.setValue(this.plugin.settings.deckImageHeight)
					.onChange(async (value) => {
						const next = value.trim() || "800px";
						this.plugin.settings.deckImageHeight = next;
						await this.plugin.saveSettings();
					}),
			);
	}
}
