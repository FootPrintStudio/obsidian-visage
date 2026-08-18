import type { TabAlign, TabPosition } from "./tabs/types";

export interface VisageSettings {
	deckGap: string;
	deckPadding: string;
	deckImageHeight: string;
	defaultPosition: TabPosition;
	defaultAlign: TabAlign;
	rememberActiveTab: boolean;
	defaultTabTitle1: string;
	defaultTabTitle2: string;
}

export const DEFAULT_SETTINGS: VisageSettings = {
	deckGap: "0.35rem",
	deckPadding: "0.65em",
	deckImageHeight: "800px",
	defaultPosition: "top",
	defaultAlign: "left",
	rememberActiveTab: true,
	defaultTabTitle1: "Tab 1",
	defaultTabTitle2: "Tab 2",
};
