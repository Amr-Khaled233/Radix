import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // `_`-prefixed names mark values that are intentionally unused (e.g. omitted by destructuring).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      // lib/zod.ts turns off Zod's JIT (CSP has no 'unsafe-eval'); type-only imports are fine.
      "@typescript-eslint/no-restricted-imports": [
        "error",
        { paths: [{ name: "zod", message: "Import { z } from '@/lib/zod'.", allowTypeImports: true }] },
      ],
    },
  },
  { files: ["lib/zod.ts"], rules: { "@typescript-eslint/no-restricted-imports": "off" } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Source material for the Brand case studies (a separate repository, not part of the site).
    "hwary_portfolio/**",
  ]),
]);

export default eslintConfig;
