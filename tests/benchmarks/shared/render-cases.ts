// @ts-nocheck
export type RenderBenchmarkCase = {
	group: string;
	name: string;
	content: string;
	compare?: boolean;
};

const simple = `# Hello World

This is a simple paragraph with **bold** and *italic* text.`;

const medium = `# Technical Documentation

## Introduction

This document covers the **implementation details** of our new API. The API provides \`REST\` endpoints for data manipulation.

### Features

- High performance
- Scalable architecture
- Easy to use
- Well documented

> **Note**: This is still in beta.

### Code Example

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

async function getUser(id: string): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
}
\`\`\`

For more information, visit [our docs](https://example.com).`;

const gfm = `# GitHub Flavored Markdown Features

## Tables

| Feature | Status | Priority |
|---------|--------|----------|
| Tables  | yes    | High     |
| Task Lists | yes | Medium   |
| Strikethrough | yes | Low  |

## Task Lists

- [x] Implement parser
- [x] Add tests
- [ ] Write documentation
- [ ] Deploy to production

## Strikethrough

This is ~~incorrect~~ correct text.

## Autolinks

Check out https://github.com for more info.`;

const rawHtml = `<div class="container">
  <section>
    <h2>Title</h2>
    <p>Paragraph with <strong>bold</strong> text.</p>
  </section>
</div>`;

const huge = `# Massive Document

${"## Section %INDEX%\n\nThis is a paragraph with **bold**, *italic*, and `code`. Here's a [link](https://example.com).\n\n```javascript\nconst value = %INDEX%;\nconsole.log(value);\n```\n\n".repeat(50).replace(/%INDEX%/g, (_match, offset) => String(Math.floor(offset / 200)))}

## Final Table

| Column 1 | Column 2 | Column 3 | Column 4 |
|----------|----------|----------|----------|
${Array.from({ length: 20 }, (_, index) => `| Value ${index}1 | Value ${index}2 | Value ${index}3 | Value ${index}4 |`).join('\n')}`;

export const renderBenchmarkCases: RenderBenchmarkCase[] = [
	{ group: 'Static Render', name: 'simple content', content: simple, compare: true },
	{ group: 'Static Render', name: 'medium content', content: medium, compare: true },
	{ group: 'Static Render', name: 'gfm content', content: gfm, compare: true },
	{ group: 'Static Render', name: 'raw html content', content: rawHtml, compare: true },
	{ group: 'Static Render', name: 'huge content', content: huge, compare: true }
];
