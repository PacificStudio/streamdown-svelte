<script lang="ts">
	import { useStreamdown, type LinkSafetyModalProps } from '$lib/context.svelte.js';
	import { isPathRelativeUrl, transformUrl } from '$lib/utils/url.js';
	import Slot from './Slot.svelte';
	import LinkSafetyModal from './LinkSafetyModal.svelte';
	import type { Tokens } from 'marked';
	import type { Snippet } from 'svelte';

	const streamdown = useStreamdown();

	const {
		children,
		token,
		id
	}: {
		children: Snippet;
		token: Tokens.Link;
		id: string;
	} = $props();

	const isRelativeUrl = $derived(isPathRelativeUrl(token.href));

	const transformedUrl = $derived(
		transformUrl(token.href, streamdown.allowedLinkPrefixes ?? [], streamdown.defaultOrigin, {
			kind: 'link'
		})
	);
	const isIncompleteLink = $derived(token.href === 'streamdown:incomplete-link');
	const canRenderLink = $derived(Boolean(transformedUrl || isIncompleteLink || isRelativeUrl));
	const href = $derived(isRelativeUrl ? token.href : (transformedUrl ?? token.href));
	const target = $derived(isRelativeUrl ? undefined : '_blank');
	const rel = $derived(isRelativeUrl ? undefined : 'noopener noreferrer');
	const shouldIntercept = $derived(
		Boolean(streamdown.linkSafety?.enabled && !isRelativeUrl && href && canRenderLink)
	);
	const customModal = $derived(
		streamdown.linkSafety?.renderModal as Snippet<[LinkSafetyModalProps]> | undefined
	);
	let isModalOpen = $state(false);

	const openHref = () => {
		if (typeof window === 'undefined' || !href || isIncompleteLink) {
			return;
		}

		window.open(href, '_blank', 'noreferrer');
	};

	const handleInterceptedClick = async (event: MouseEvent) => {
		if (!shouldIntercept || isIncompleteLink) {
			return;
		}

		event.preventDefault();

		try {
			if (streamdown.linkSafety?.onLinkCheck) {
				const isAllowed = await streamdown.linkSafety.onLinkCheck(href);
				if (isAllowed) {
					openHref();
					return;
				}
			}
		} catch {
			// Fall through to the confirmation modal when the checker fails closed.
		}

		isModalOpen = true;
	};

	const modalProps = $derived({
		url: href ?? '',
		isOpen: isModalOpen,
		onClose: () => {
			isModalOpen = false;
		},
		onConfirm: openHref
	} satisfies LinkSafetyModalProps);
</script>

{#if canRenderLink}
	{#if shouldIntercept}
		<button
			type="button"
			data-streamdown="link"
			data-streamdown-link={id}
			data-incomplete={isIncompleteLink ? 'true' : undefined}
			class={`${streamdown.theme.link.base} appearance-none border-none bg-transparent p-0 text-left`}
			onclick={(event) => void handleInterceptedClick(event)}
		>
			{@render children()}
		</button>
		{#if customModal}
			{@render customModal(modalProps)}
		{:else}
			<LinkSafetyModal {...modalProps} />
		{/if}
	{:else}
		<Slot
			props={{
				href,
				target,
				rel,
				title: token.title,
				class: streamdown.theme.link.base,
				children,
				token
			}}
			render={streamdown.snippets.link}
			component={streamdown.components?.a}
		>
			<a
				data-streamdown="link"
				data-streamdown-link={id}
				data-incomplete={isIncompleteLink ? 'true' : undefined}
				class={streamdown.theme.link.base}
				{href}
				{target}
				{rel}
			>
				{@render children()}
			</a>
		</Slot>
	{/if}
{:else}
	<span
		data-streamdown-link-blocked={id}
		class={streamdown.theme.link.blocked}
		title={token.title ? `Blocked URL: ${token.href}` : undefined}
	>
		{@render children()} [blocked]
	</span>
{/if}
