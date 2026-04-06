# remend

Streaming-friendly incomplete Markdown repair extracted from the `svelte-streamdown` workspace.

## Installation

```bash
pnpm add remend
```

## Usage

```ts
import { parseIncompleteMarkdown } from 'remend';

const repaired = parseIncompleteMarkdown('Hello **world');
```

This package currently shares its canonical source with the root `svelte-streamdown` package while the workspace split is being phased in.
