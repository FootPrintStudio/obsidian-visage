# Visage

FootPrintStudio plugin for [Obsidian](https://obsidian.md): Reading-view cards from ordinary markdown lists.

Mark a list item with a leading inline code token `` `v-card` ``. The rest of the item stays normal markdown — spell-check, nested fences, wikilinks, images, headings, and Grimoire `` `q=` `` keep working.

```markdown
- `v-card` ## Word Processing
	- Normal nested list
	- `v-card` Subcard
```

A top-level list becomes a card deck (wraps at 8 slots) when it has at least one `v-card` child. Default cards on a short row share the width equally. Unmarked siblings stay ordinary list rows.

## Install (BRAT)

Not in the Obsidian Community Plugins catalog. Install via [BRAT](https://github.com/TfTHacker/obsidian42-brat):

1. Enable **BRAT** in Community Plugins.
2. **Add Beta plugin** → `FootPrintStudio/obsidian-visage`
3. Enable **Visage** and reload Obsidian.

BRAT installs from [GitHub Releases](https://github.com/FootPrintStudio/obsidian-visage/releases). Each release attaches `main.js`, `manifest.json`, `styles.css`, and `versions.json`.

### From source

```bash
cd /path/to/vault/.obsidian/plugins
git clone https://github.com/FootPrintStudio/obsidian-visage.git visage
cd visage
./build.sh
```

Enable **Visage** under Community plugins and reload Obsidian.

## Quick syntax

Required, first inline code on the item:

- `` `v-card` ``

Optional exclusive bags (at most one of each key; order does not matter):

- `` `v-card {span=2} {layout=hero} {tone=warning}` ``

| Key | Values |
|-----|--------|
| `span` | `2`–`7`, `full`, `fill` (default: grow equally on the row) |
| `layout` | `hero` (any card); `inline` / `footer` (subcards only) |
| `tone` | hex (`#8c65e6`), `rgb()` / `rgba()`, or `note` `tip` `warning` `danger` `success` `neutral` |

Same-line headings after the marker are promoted in Reading view:

```markdown
- `v-card` # Heading
- `v-card {span=2}` ## Section title
```

Full grammar: **Settings → Guide** or [docs/GUIDE.md](docs/GUIDE.md).

## ListDecks snippet

Launcher notes that still use `cssclasses: list-deck` and HTML `data-*` spans should keep the **ListDecks** CSS snippet on. **Disable that snippet on notes that use Visage** so card styles do not double-apply.

Visage does **not** require `cssclasses: list-deck`. Live Preview is out of scope.

## Settings

Open **Settings → Community plugins → Visage** (Settings | README | Guide).

| Setting | CSS variable | Default |
|---------|--------------|---------|
| Card gap | `--deck-gap` | `0.35rem` |
| Card padding | `--deck-padding` | `0.65em` |
| Image height | `--deck-image-height` | `800px` |

## Develop / rebuild

```bash
./build.sh
./test.sh
```

## Credits

Card look is based on [kepano/obsidian-card-layout](https://github.com/kepano/obsidian-card-layout) / ListDecks (MIT).
