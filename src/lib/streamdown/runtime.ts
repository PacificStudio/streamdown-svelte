import type { StreamdownContext as StreamdownContextContract } from '../contracts/streamdown.js';
import {
	defineGetterBackedProperties,
	defineForwardedProperties,
	type PropertyKeyOf
} from '../utils/bind.js';

type RuntimeGetter<T> = () => T;

type RuntimeSectionGetters<T extends object> = {
	[K in keyof T]-?: RuntimeGetter<T[K]>;
};

type ParseRuntimeShape<Source extends Record<string, any>> = Pick<
	StreamdownContextContract<Source>,
	| 'content'
	| 'remend'
	| 'parseIncompleteMarkdown'
	| 'parseMarkdownIntoBlocksFn'
	| 'mode'
	| 'dir'
	| 'sources'
	| 'inlineCitationsMode'
	| 'extensions'
>;

type SecurityRuntimeShape<Source extends Record<string, any>> = Pick<
	StreamdownContextContract<Source>,
	| 'defaultOrigin'
	| 'allowedLinkPrefixes'
	| 'allowedImagePrefixes'
	| 'linkSafety'
	| 'allowedTags'
	| 'allowedElements'
	| 'allowElement'
	| 'disallowedElements'
	| 'literalTagContent'
	| 'normalizeHtmlIndentation'
	| 'skipHtml'
	| 'unwrapDisallowed'
	| 'urlTransform'
	| 'renderHtml'
>;

type RenderRuntimeShape<Source extends Record<string, any>> = Pick<
	StreamdownContextContract<Source>,
	| 'BlockComponent'
	| 'prefix'
	| 'lineNumbers'
	| 'shikiTheme'
	| 'snippets'
	| 'theme'
	| 'baseTheme'
	| 'mermaidConfig'
	| 'mermaid'
	| 'katexConfig'
	| 'plugins'
	| 'translations'
	| 'shikiLanguages'
	| 'shikiThemes'
	| 'children'
	| 'mdxComponents'
	| 'components'
>;

type UiConfigRuntimeShape<Source extends Record<string, any>> = Pick<
	StreamdownContextContract<Source>,
	| 'element'
	| 'animation'
	| 'isAnimating'
	| 'animated'
	| 'caret'
	| 'onAnimationStart'
	| 'onAnimationEnd'
	| 'controls'
	| 'codeControls'
	| 'icons'
>;

type RuntimeKey<T extends object> = PropertyKeyOf<T>;

const defineRuntimeSectionProperties = <Shape extends object>(
	target: object,
	getters: RuntimeSectionGetters<Shape>,
	keys: readonly RuntimeKey<Shape>[]
) => {
	defineGetterBackedProperties(
		target,
		getters as {
			[K in RuntimeKey<Shape>]: () => Shape[K];
		},
		keys
	);
};

export const parseRuntimeKeys = [
	'content',
	'remend',
	'parseIncompleteMarkdown',
	'parseMarkdownIntoBlocksFn',
	'mode',
	'dir',
	'sources',
	'inlineCitationsMode',
	'extensions'
] as const satisfies readonly RuntimeKey<ParseRuntimeShape<Record<string, any>>>[];

export const securityRuntimeKeys = [
	'defaultOrigin',
	'allowedLinkPrefixes',
	'allowedImagePrefixes',
	'linkSafety',
	'allowedTags',
	'allowedElements',
	'allowElement',
	'disallowedElements',
	'literalTagContent',
	'normalizeHtmlIndentation',
	'skipHtml',
	'unwrapDisallowed',
	'urlTransform',
	'renderHtml'
] as const satisfies readonly RuntimeKey<SecurityRuntimeShape<Record<string, any>>>[];

export const renderRuntimeKeys = [
	'BlockComponent',
	'prefix',
	'lineNumbers',
	'shikiTheme',
	'snippets',
	'theme',
	'baseTheme',
	'mermaidConfig',
	'mermaid',
	'katexConfig',
	'plugins',
	'translations',
	'shikiLanguages',
	'shikiThemes',
	'children',
	'mdxComponents',
	'components'
] as const satisfies readonly RuntimeKey<RenderRuntimeShape<Record<string, any>>>[];

export const uiConfigRuntimeKeys = [
	'element',
	'animation',
	'isAnimating',
	'animated',
	'caret',
	'onAnimationStart',
	'onAnimationEnd',
	'controls',
	'codeControls',
	'icons'
] as const satisfies readonly RuntimeKey<UiConfigRuntimeShape<Record<string, any>>>[];

export type StreamdownParseRuntimeInit<Source extends Record<string, any>> = RuntimeSectionGetters<
	ParseRuntimeShape<Source>
>;

export type StreamdownSecurityRuntimeInit<Source extends Record<string, any>> =
	RuntimeSectionGetters<SecurityRuntimeShape<Source>>;

export type StreamdownRenderRuntimeInit<Source extends Record<string, any>> = RuntimeSectionGetters<
	RenderRuntimeShape<Source>
>;

export type StreamdownUiConfigRuntimeInit<Source extends Record<string, any>> =
	RuntimeSectionGetters<UiConfigRuntimeShape<Source>>;

export type StreamdownRuntimeSectionName = 'parse' | 'security' | 'render' | 'uiConfig';

export type StreamdownRuntimeSections<Source extends Record<string, any>> = {
	parse: StreamdownParseRuntimeInit<Source>;
	security: StreamdownSecurityRuntimeInit<Source>;
	render: StreamdownRenderRuntimeInit<Source>;
	uiConfig: StreamdownUiConfigRuntimeInit<Source>;
};

export const streamdownRuntimeSectionKeys = {
	parse: parseRuntimeKeys,
	security: securityRuntimeKeys,
	render: renderRuntimeKeys,
	uiConfig: uiConfigRuntimeKeys
} as const;

export function defineRuntimeSectionBridge<Source extends Record<string, any>>(
	target: object,
	sectionName: 'parse',
	getSection: () => ParseRuntimeShape<Source>
): void;
export function defineRuntimeSectionBridge<Source extends Record<string, any>>(
	target: object,
	sectionName: 'security',
	getSection: () => SecurityRuntimeShape<Source>
): void;
export function defineRuntimeSectionBridge<Source extends Record<string, any>>(
	target: object,
	sectionName: 'render',
	getSection: () => RenderRuntimeShape<Source>
): void;
export function defineRuntimeSectionBridge<Source extends Record<string, any>>(
	target: object,
	sectionName: 'uiConfig',
	getSection: () => UiConfigRuntimeShape<Source>
): void;
export function defineRuntimeSectionBridge<Source extends Record<string, any>>(
	target: object,
	sectionName: StreamdownRuntimeSectionName,
	getSection: () =>
		| ParseRuntimeShape<Source>
		| SecurityRuntimeShape<Source>
		| RenderRuntimeShape<Source>
		| UiConfigRuntimeShape<Source>
): void {
	switch (sectionName) {
		case 'parse':
			defineForwardedProperties(
				target,
				() => getSection() as ParseRuntimeShape<Source>,
				parseRuntimeKeys as readonly RuntimeKey<ParseRuntimeShape<Source>>[]
			);
			return;
		case 'security':
			defineForwardedProperties(
				target,
				() => getSection() as SecurityRuntimeShape<Source>,
				securityRuntimeKeys as readonly RuntimeKey<SecurityRuntimeShape<Source>>[]
			);
			return;
		case 'render':
			defineForwardedProperties(
				target,
				() => getSection() as RenderRuntimeShape<Source>,
				renderRuntimeKeys as readonly RuntimeKey<RenderRuntimeShape<Source>>[]
			);
			return;
		case 'uiConfig':
			defineForwardedProperties(
				target,
				() => getSection() as UiConfigRuntimeShape<Source>,
				uiConfigRuntimeKeys as readonly RuntimeKey<UiConfigRuntimeShape<Source>>[]
			);
			return;
	}
}

export interface StreamdownParseRuntime<Source extends Record<string, any> = Record<string, any>>
	extends ParseRuntimeShape<Source> {}

export class StreamdownParseRuntime<Source extends Record<string, any> = Record<string, any>> {
	constructor(private readonly getters: StreamdownParseRuntimeInit<Source>) {
		defineRuntimeSectionProperties(this, getters, parseRuntimeKeys);
	}
}

export interface StreamdownSecurityRuntime<
	Source extends Record<string, any> = Record<string, any>
> extends SecurityRuntimeShape<Source> {}

export class StreamdownSecurityRuntime<Source extends Record<string, any> = Record<string, any>> {
	constructor(private readonly getters: StreamdownSecurityRuntimeInit<Source>) {
		defineRuntimeSectionProperties(this, getters, securityRuntimeKeys);
	}
}

export interface StreamdownRenderRuntime<Source extends Record<string, any> = Record<string, any>>
	extends RenderRuntimeShape<Source> {}

export class StreamdownRenderRuntime<Source extends Record<string, any> = Record<string, any>> {
	constructor(private readonly getters: StreamdownRenderRuntimeInit<Source>) {
		defineRuntimeSectionProperties(this, getters, renderRuntimeKeys);
	}
}

export interface StreamdownUiConfigRuntime<
	Source extends Record<string, any> = Record<string, any>
> extends UiConfigRuntimeShape<Source> {}

export class StreamdownUiConfigRuntime<Source extends Record<string, any> = Record<string, any>> {
	constructor(private readonly getters: StreamdownUiConfigRuntimeInit<Source>) {
		defineRuntimeSectionProperties(this, getters, uiConfigRuntimeKeys);
	}
}
