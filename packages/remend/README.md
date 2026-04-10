# remend

Streaming-friendly incomplete Markdown repair extracted from the `streamdown-svelte` workspace.

## Installation

```bash
pnpm add @streamdown-svelte/remend
```

## Usage

```ts
import remend, {
  IncompleteMarkdownParser,
  isWordChar,
  parseIncompleteMarkdown,
  type RemendHandler
} from '@streamdown-svelte/remend';
import { findMatchingOpeningBracket } from '@streamdown-svelte/remend/utils';

const repaired = remend('Hello **world');
const parsed = parseIncompleteMarkdown('Hello **world');
const isWord = isWordChar('a');
const bracketIndex = findMatchingOpeningBracket('[abc]', 4);
const parser = new IncompleteMarkdownParser();

const handler: RemendHandler = {
  name: 'demo',
  handle: (text) => text
};
```

This package exposes the standalone parser contract used by the Streamdown-style workspace split, including incomplete-markdown parser helpers, custom handlers, and utility helpers. The root `streamdown-svelte/remend` subpath delegates to this package so both import surfaces stay aligned.
