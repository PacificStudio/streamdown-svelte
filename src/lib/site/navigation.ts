export type SiteNavItem = {
	label: string;
	href: string;
	match: (pathname: string, hash: string) => boolean;
};

export const siteNavItems: readonly SiteNavItem[] = [
	{
		label: 'Docs',
		href: '/docs',
		match: (pathname) => pathname === '/docs' || pathname === '/prompting'
	},
	{
		label: 'Features',
		href: '/#features',
		match: (pathname, hash) => pathname === '/' && (hash === '' || hash === '#features')
	},
	{
		label: 'Plugins',
		href: '/#plugins',
		match: (pathname, hash) => pathname === '/' && hash === '#plugins'
	},
	{
		label: 'Playground',
		href: '/playground',
		match: (pathname) => pathname === '/playground'
	}
] as const;
