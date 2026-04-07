import type { Tokens } from 'marked';
import type { UrlTransform } from '../markdown.js';
import { escapeHtml, renderMarkdownFragment } from '../security/html.js';
import type { AllowedTags } from '../security/types.js';

export type BlockHtmlRenderOptions = {
	allowedImagePrefixes?: string[];
	allowedLinkPrefixes?: string[];
	allowedTags?: AllowedTags;
	defaultOrigin?: string;
	renderHtml?: boolean | ((token: Tokens.HTML | Tokens.Tag) => string);
	skipHtml?: boolean;
	urlTransform?: UrlTransform;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const isSecurityHtmlBlock = (
	markdown: string,
	{ allowedTags, skipHtml }: Pick<BlockHtmlRenderOptions, 'allowedTags' | 'skipHtml'>
): boolean => {
	if (skipHtml) {
		return false;
	}

	const trimmed = markdown.trimStart();
	if (trimmed.startsWith('<')) {
		return true;
	}

	return Object.keys(allowedTags ?? {}).some((tagName) =>
		new RegExp(`<\\/?${escapeRegExp(tagName)}(?=[\\s>/])`, 'i').test(markdown)
	);
};

export const renderBlockHtml = (
	markdown: string,
	options: BlockHtmlRenderOptions
): string | null => {
	if (!isSecurityHtmlBlock(markdown, options)) {
		return null;
	}

	if (options.renderHtml === false) {
		return escapeHtml(markdown);
	}

	return renderMarkdownFragment(markdown, {
		allowedImagePrefixes: options.allowedImagePrefixes,
		allowedLinkPrefixes: options.allowedLinkPrefixes,
		allowedTags: options.allowedTags,
		defaultOrigin: options.defaultOrigin,
		urlTransform: options.urlTransform
	});
};
