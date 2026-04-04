import { mount } from 'svelte';
import '../../parity-shared/app-shell.css';
import { installParityColorSchemeSync } from '../../parity-shared/color-scheme.js';
import '../../parity-shared/parity-tailwind.css';
import App from './App.svelte';

installParityColorSchemeSync();

mount(App, {
	target: document.getElementById('app')!
});
