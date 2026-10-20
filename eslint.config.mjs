import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Node-only CJS processing tooling for CityScan (not part of the Next.js app).
    "src/lib/cityscan/**",
    // Root-level scratch/debug/patch scripts for the CityScan pipeline (Node-only tooling, not app code).
    "debug-*.ts",
    "debug-*.cjs",
    "debug-*.js",
    "patch-*.cjs",
    "patch-*.js",
    "scan-*.cjs",
    "scan-runner.js",
    "scan-post.cjs",
    "*.log",
    "out-*.txt",
    "out-scan.ts",
    "tokyo-result.txt",
    "stac-london.txt",
    "london-scan.log",
    "old-cityscanpage.txt",
  ]),
]);

export default eslintConfig;
