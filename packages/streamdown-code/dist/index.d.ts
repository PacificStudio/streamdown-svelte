import { ThemeInput, CodeHighlighterPlugin } from '@streamdown/plugin-core';
export { CodeHighlighterPlugin, HighlightOptions, HighlightResult, HighlightToken, ThemeInput } from '@streamdown/plugin-core';

interface CodePluginOptions {
    themes?: [ThemeInput, ThemeInput];
}
declare const createCodePlugin: (options?: CodePluginOptions) => CodeHighlighterPlugin;
declare const code: CodeHighlighterPlugin;

export { type CodePluginOptions, code, createCodePlugin };
