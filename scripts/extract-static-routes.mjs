import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Pure contract for the generated route tree: given the `routeTree.gen.ts`
 * source text, return the flat list of routes that can be safely prerendered
 * as static HTML.
 *
 * Routes containing dynamic params (`$param`) or splats (`$$`) are excluded
 * because they cannot be enumerated at build time without an explicit list.
 *
 * @param {string} source - contents of `routeTree.gen.ts`
 * @param {string} [origin] - label used in the error message when no union is found
 * @returns {string[]} sorted, deduplicated route paths (e.g. `['/', '/playground', '/settings']`)
 */
export function parseStaticRoutes(source, origin = "route tree source") {
  const match = source.match(/fullPaths:\s*([^\n;]+)/);
  if (!match) {
    throw new Error(
      `Could not find 'fullPaths' union in ${origin}. ` +
        "Ensure TanStack Router has generated the route tree (run 'yarn dev' or 'yarn build' first)."
    );
  }
  const union = match[1];
  const routes = Array.from(union.matchAll(/'([^']+)'/g)).map(m => m[1]);
  const filtered = routes.filter(route => !route.includes("$"));
  return Array.from(new Set(filtered)).sort();
}

/**
 * Reads `routeTree.gen.ts` from disk and delegates to {@link parseStaticRoutes}.
 *
 * @param {string} routeTreePath - absolute path to `routeTree.gen.ts`
 * @returns {string[]} sorted, deduplicated route paths
 */
export function extractStaticRoutes(routeTreePath) {
  const source = fs.readFileSync(routeTreePath, "utf8");
  return parseStaticRoutes(source, routeTreePath);
}

const isCli = (() => {
  if (!process.argv[1]) {
    return false;
  }
  const invoked = path.resolve(process.argv[1]);
  const self = fileURLToPath(import.meta.url);
  return invoked === self;
})();

if (isCli) {
  const routeTreePath = path.resolve(process.argv[2] ?? "src/routeTree.gen.ts");
  for (const route of extractStaticRoutes(routeTreePath)) {
    console.log(route);
  }
}
