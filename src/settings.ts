import { Component, PluginSettingTab, Setting } from "obsidian";
import type VisagePlugin from "./main";
import {
	renderGuidePanel,
	renderReadmePanel,
	renderSettingsTabBar,
	type PluginSettingsTabId,
} from "./readmeTab";
import { TAB_ALIGNS, TAB_POSITIONS } from "./tabs/types";
import { DEFAULT_SETTINGS } from "./types";

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
			text: "Reading view only. Cards use a leading `v-card` token on list items. Tabs use a `v-tabs` fence. Disable the ListDecks CSS snippet on notes that use Visage cards so styles do not double-apply. Disable the Content Tabs plugin — tabs now live in Visage.",
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

		containerEl.createEl("h3", { text: "Tabs" });

		new Setting(containerEl)
			.setName("Default tab position")
			.setDesc("Used when POSITION is omitted from a `v-tabs` block.")
			.addDropdown((dropdown) => {
				for (const position of TAB_POSITIONS) dropdown.addOption(position, position);
				dropdown.setValue(this.plugin.settings.defaultPosition).onChange(async (value) => {
					this.plugin.settings.defaultPosition = value as typeof DEFAULT_SETTINGS.defaultPosition;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Default tab align")
			.setDesc("Used when ALIGN is omitted. Applies to top and bottom nav only.")
			.addDropdown((dropdown) => {
				for (const align of TAB_ALIGNS) dropdown.addOption(align, align);
				dropdown.setValue(this.plugin.settings.defaultAlign).onChange(async (value) => {
					this.plugin.settings.defaultAlign = value as typeof DEFAULT_SETTINGS.defaultAlign;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Remember active tab")
			.setDesc("Restore the last selected tab when reopening a note (session memory).")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.rememberActiveTab).onChange(async (value) => {
					this.plugin.settings.rememberActiveTab = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Default tab 1 title")
			.setDesc("Title for the first tab in the insert template.")
			.addText((text) =>
				text.setValue(this.plugin.settings.defaultTabTitle1).onChange(async (value) => {
					this.plugin.settings.defaultTabTitle1 = value.trim() || DEFAULT_SETTINGS.defaultTabTitle1;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Default tab 2 title")
			.setDesc("Title for the second tab in the insert template.")
			.addText((text) =>
				text.setValue(this.plugin.settings.defaultTabTitle2).onChange(async (value) => {
					this.plugin.settings.defaultTabTitle2 = value.trim() || DEFAULT_SETTINGS.defaultTabTitle2;
					await this.plugin.saveSettings();
				}),
			);
	}
}
