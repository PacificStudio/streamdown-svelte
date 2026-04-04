const getPreferredColorScheme = (): 'light' | 'dark' =>
	window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const applyColorScheme = (scheme: 'light' | 'dark') => {
	document.documentElement.dataset.theme = scheme;
	document.documentElement.classList.toggle('dark', scheme === 'dark');
	document.documentElement.style.colorScheme = scheme;
};

export const installParityColorSchemeSync = (): (() => void) => {
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	const sync = () => applyColorScheme(getPreferredColorScheme());

	sync();
	mediaQuery.addEventListener('change', sync);

	return () => {
		mediaQuery.removeEventListener('change', sync);
	};
};
