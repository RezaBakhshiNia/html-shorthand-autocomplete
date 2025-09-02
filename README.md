# HTML Shorthand Autocomplete

A lightweight VS Code extension that turns shorthand like `.class1.class2`, `#hero`, `section.flex`, `tag#id`, and `tag.c1.c2` into full HTML/JSX tags.

- **Default tag**: `div` (when no tag is specified)
- **Works in**: HTML, JSX (JavaScript React) and TSX (TypeScript React)
- **Triggers on**: `.`, `#`, or any alphanumeric character (we register `.` and `#` as trigger characters and scan for alpha tokens)
- **Powered by**: VS Code CompletionItemProvider API

## Examples

| Typed               | Suggestion                          |
| ------------------- | ----------------------------------- |
| `.class1.class2`    | `<div class="class1 class2"></div>` |
| `section.flex`      | `<section class="flex"></section>`  |
| `#idName`           | `<div id="idName"></div>`           |
| `tag#idName`        | `<tag id="idName"></tag>`           |
| `tag.class1.class2` | `<tag class="class1 class2"></tag>` |

> In JSX/TSX files, the extension uses `className` instead of `class`.

## Installation (from source)

1. Clone this repository
2. Install dependencies

   ```bash
   npm install
   ```

3. Build

   ```bash
   npm run compile
   ```

4. Launch the extension
   - Press `F5` in VS Code to start an Extension Development Host

## Publish to the Marketplace

1. Make sure you have a `publisher` set in `package.json` and you own it on the VS Code Marketplace.
2. Login with `vsce`:

   ```bash
   npx vsce login <your-publisher-id>
   ```

3. Package and publish:

   ```bash
   npm run package   # creates .vsix
   npm run publish   # publishes to Marketplace
   ```

## How it works

- The extension listens to `.` `#` keys and scans the current line for a shorthand sequence immediately before the cursor.
- It parses the sequence into `tag`, `id`, and `class(es)` and proposes a single high-priority completion that replaces the shorthand with a snippet like:

  ```html
  <tag id="idName" class="c1 c2">$0</tag>
  ```

- In React files (`javascriptreact`/`typescriptreact`), `class` is automatically swapped for `className`.

## Performance & Scope

- Activated only for `html`, `javascriptreact`, and `typescriptreact` via `onLanguage` activation events.
- Parsing is done on the current token only (no document scans), keeping it fast and responsive.

## Configuration

- `htmlShorthandAutocomplete.enable` (default: `true`) — toggle the provider.

## Notes & Limitations

- The provider only suggests when the sequence contains at least one `.` or `#` (e.g., `section.flex`, `#hero`, `.box`). Pure tag names like `section` alone don’t trigger a suggestion.
- Tag/attribute names support letters, digits, underscore, and hyphen (e.g., `my-component.flex-row`).
