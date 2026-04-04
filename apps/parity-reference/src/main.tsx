import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../parity-shared/app-shell.css';
import { installParityColorSchemeSync } from '../../parity-shared/color-scheme.js';
import '../../parity-shared/parity-tailwind.css';
import { App } from './App';

installParityColorSchemeSync();

ReactDOM.createRoot(document.getElementById('app')!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
