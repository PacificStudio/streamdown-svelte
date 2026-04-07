"use client";

// index.ts
import { bundledLanguagesInfo } from "@streamdown/plugin-core";
import {
  createCodePlugin as createSharedCodePlugin
} from "@streamdown/plugin-core";
var createCodePlugin = (options = {}) => createSharedCodePlugin({
  languages: bundledLanguagesInfo,
  themes: options.themes
});
var code = createCodePlugin();
export {
  code,
  createCodePlugin
};
