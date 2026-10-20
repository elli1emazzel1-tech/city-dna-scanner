/**
 * Node ESM resolve hook that lets plain Node load the app's TypeScript
 * modules (which use extensionless relative imports, e.g. `./spatialCache`).
 *
 * Node 24 strips the TypeScript types natively; this hook only supplies the
 * missing file extensions so the real source can be imported as-is.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CANDIDATE_SUFFIXES = ['.ts', '.tsx', '.mts', '.js', '.mjs'];

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    const parentPath = context.parentURL ? fileURLToPath(context.parentURL) : process.cwd();
    const base = path.resolve(path.dirname(parentPath), specifier);
    const candidates = [
      ...CANDIDATE_SUFFIXES.map((suffix) => `${base}${suffix}`),
      ...CANDIDATE_SUFFIXES.map((suffix) => path.join(base, `index${suffix}`)),
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return nextResolve(pathToFileURL(candidate).href, context);
      }
    }
  }
  return nextResolve(specifier, context);
}
