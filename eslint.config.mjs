import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Node
  {
    files: ["**/*.js"],
    ignores: ["www/**"],
    ...js.configs.recommended,
    languageOptions: {
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-empty": "off",
    }
  },

  // module系
  {
    files: ["bds/**/*.js", "default_server_addon/**/*.js"],
    languageOptions: {
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "off" // ← addon系は無視
    }
  },

  // browser
  {
    files: ["www/**/*.js"],
    ...js.configs.recommended,
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "no-unused-vars": "warn"
    }
  }
]);