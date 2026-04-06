"use client";

import {
	cjk as sharedCjk,
	createCjkPlugin as createSharedCjkPlugin,
	type CjkPlugin
} from "../../src/lib/plugins/cjk-shared.js";

export type { CjkPlugin };

export const createCjkPlugin = createSharedCjkPlugin;
export const cjk = sharedCjk;
