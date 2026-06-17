import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(testDir, "..");
const appRoot = path.join(frontendRoot, "app");
const readmePath = path.join(frontendRoot, "README.md");

function collectRoutes(dir, prefix = "") {
  const entries = readdirSync(dir).sort();
  const routes = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      const nextPrefix =
        entry.startsWith("(") && entry.endsWith(")")
          ? prefix
          : `${prefix}/${entry}`;

      routes.push(...collectRoutes(entryPath, nextPrefix));
      continue;
    }

    if (entry === "page.tsx") {
      routes.push(prefix || "/");
    }
  }

  return routes;
}

test("frontend README important routes match the shipped app pages", () => {
  const source = readFileSync(readmePath, "utf8");
  const actualRoutes = collectRoutes(appRoot).filter((route) =>
    ["/", "/chat", "/usage", "/watchlist", "/strategy", "/proofs", "/settings", "/key", "/memory", "/task"].includes(route)
  );

  for (const route of actualRoutes) {
    assert.ok(
      source.includes(`\`${route}\``),
      `Expected frontend README to document route ${route}`
    );
  }
});
