import * as vscode from 'vscode';

/**
 * Parse shorthand like:
 *   .c1.c2          => { tag: 'div', id: undefined, classes: ['c1','c2'] }
 *   #idName          => { tag: 'div', id: 'idName', classes: [] }
 *   section.flex     => { tag: 'section', id: undefined, classes: ['flex'] }
 *   tag#idName       => { tag: 'tag', id: 'idName', classes: [] }
 *   tag.c1.c2        => { tag: 'tag', id: undefined, classes: ['c1','c2'] }
 */
function parseShorthand(input: string): { tag: string; id?: string; classes: string[] } | null {
  if (!/[#.]/.test(input)) return null; // must contain at least one . or #
  let i = 0;
  let tag = 'div';
  let id: string | undefined;
  const classes: string[] = [];

  const isNameChar = (ch: string) => /[\w-]/.test(ch);

  const readName = () => {
    let start = i;
    while (i < input.length && isNameChar(input[i])) i++;
    return input.slice(start, i);
  };

  // Optional leading tag (must start with a letter)
  if (/^[A-Za-z]/.test(input)) {
    const name = readName();
    tag = name || 'div';
  }

  while (i < input.length) {
    const ch = input[i];
    if (ch === '#') {
      i++;
      const name = readName();
      if (!name) return null;
      id = name;
    } else if (ch === '.') {
      i++;
      const name = readName();
      if (!name) return null;
      classes.push(name);
    } else {
      // Invalid character for shorthand sequence
      return null;
    }
  }

  return { tag, id, classes };
}

function buildSnippet(parsed: { tag: string; id?: string; classes: string[] }, languageId: string): vscode.SnippetString {
  const classAttrName = (languageId === 'javascriptreact' || languageId === 'typescriptreact') ? 'className' : 'class';

  const attrParts: string[] = [];
  if (parsed.id) attrParts.push(`id="${parsed.id}"`);
  if (parsed.classes.length) attrParts.push(`${classAttrName}="${parsed.classes.join(' ')}"`);
  const attrs = attrParts.length ? ' ' + attrParts.join(' ') : '';

  const snippet = `<${parsed.tag}${attrs}>$0</${parsed.tag}>`;
  return new vscode.SnippetString(snippet);
}

function getCurrentShorthand(document: vscode.TextDocument, position: vscode.Position): { range: vscode.Range; text: string } | null {
  const line = document.lineAt(position.line).text;
  const upto = line.slice(0, position.character);

  // Match a shorthand token at the end of the prefix
  // examples matched: .a.b, #id, section.flex, tag#id, tag.c1.c2
  const m = upto.match(/([A-Za-z][\w-]*)?(?:[.#][\w-]+)+$/);
  if (!m) return null;

  const text = m[0];
  const startCol = upto.length - text.length;
  const range = new vscode.Range(position.line, startCol, position.line, position.character);
  return { range, text };
}

export function activate(context: vscode.ExtensionContext) {
  const enabled = vscode.workspace.getConfiguration().get<boolean>('htmlShorthandAutocomplete.enable', true);
  if (!enabled) return;

  const languages = ['html', 'javascriptreact', 'typescriptreact'];
  const triggerChars = ['.', '#'];// We'll register with only '.' and '#' and also support alpha via regex scanning

  const provider: vscode.CompletionItemProvider = {
    provideCompletionItems(document, position) {
      const current = getCurrentShorthand(document, position);
      if (!current) return undefined;

      const parsed = parseShorthand(current.text);
      if (!parsed) return undefined;

      const item = new vscode.CompletionItem(`<${parsed.tag}${parsed.id ? ' #' + parsed.id : ''}${parsed.classes.length ? ' .' + parsed.classes.join('.') : ''}>`, vscode.CompletionItemKind.Snippet);
      item.insertText = buildSnippet(parsed, document.languageId);
      item.range = current.range;
      item.filterText = current.text;
      item.sortText = '0000'; // Prefer our completion
      item.detail = 'HTML Shorthand → Full Tag';
      item.documentation = new vscode.MarkdownString(
        'Expands shorthand like `section.flex` → `<section class="flex"></section>`.'
      );

      return [item];
    },
  };

  for (const lang of languages) {
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider({ language: lang }, provider, ...triggerChars)
    );
  }
}

export function deactivate() {}
