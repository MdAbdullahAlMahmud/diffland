/**
 * ESLint config with a boundary rule enforcing the architecture:
 *   - `core` must NOT import from renderers or I/O packages
 *   - renderers (`ui`, `tui`) must NOT import git providers directly
 *   - everyone may import from `core`
 *
 * See DIFFLAND_ARCHITECTURE.md §3 "arrows only point inward".
 */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "boundaries"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:boundaries/recommended",
  ],
  settings: {
    "boundaries/elements": [
      { type: "core", pattern: "packages/core/**" },
      { type: "git-provider", pattern: "packages/git-*/**" },
      { type: "cli", pattern: "packages/cli/**" },
      { type: "ui", pattern: "packages/ui/**" },
      { type: "tui", pattern: "packages/tui/**" },
      { type: "svg", pattern: "packages/svg/**" },
      { type: "sdk", pattern: "packages/sdk/**" },
      { type: "app", pattern: "apps/**" },
      { type: "adapter", pattern: "adapters/**" },
    ],
  },
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "boundaries/element-types": [
      "error",
      {
        default: "allow",
        rules: [
          {
            from: "core",
            disallow: ["cli", "ui", "tui", "svg", "git-provider", "app", "adapter"],
            message: "core must be pure — no I/O or rendering imports",
          },
          {
            from: "ui",
            disallow: ["git-provider", "cli"],
            message: "ui must not call git or CLI code directly",
          },
          {
            from: "tui",
            disallow: ["git-provider", "cli"],
            message: "tui must not call git or CLI code directly",
          },
        ],
      },
    ],
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "fs",
            message: "Use FsProvider from @diffland/core instead (except in git-* packages).",
          },
          {
            name: "child_process",
            message: "Use GitProvider from @diffland/core instead (except in git-* packages).",
          },
        ],
      },
    ],
  },
  overrides: [
    {
      // git provider packages are the only place raw I/O is allowed
      files: ["packages/git-*/**/*.ts"],
      rules: { "no-restricted-imports": "off" },
    },
    {
      files: ["**/*.test.ts", "**/tests/**/*.ts"],
      rules: { "no-restricted-imports": "off" },
    },
  ],
  ignorePatterns: ["dist", "node_modules", "coverage", "*.cjs", "*.config.*"],
};
