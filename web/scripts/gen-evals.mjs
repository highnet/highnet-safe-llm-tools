// Copies the published eval results (evals/results/latest.json) into the web build, so the
// /evals page is static and renders only numbers from that file. With no published run it
// writes `null` and the page says so. Run: npm run gen:evals (CI fails if the copy is stale).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const source = process.env.EVALS_RESULTS ?? path.join(repoRoot, 'evals/results/latest.json');
const outFile = path.join(here, '../lib/generated/evals-latest.json');

// A web-only checkout (no evals/) keeps the committed copy.
if (!existsSync(path.join(repoRoot, 'evals'))) {
  console.log('No evals/; keeping the committed evals-latest.json');
  process.exit(0);
}

const results = existsSync(source) ? JSON.parse(readFileSync(source, 'utf8')) : null;
writeFileSync(outFile, `${JSON.stringify(results, null, 2)}\n`);
console.log(
  results
    ? `Copied ${path.relative(repoRoot, source)} (run ${results.run.started_at})`
    : 'No published eval results; wrote null',
);

// Scope's published run (evals/results/scope/latest.json), copied the same way for /scope/evals/
// and /scope/coverage/.
const scopeSource =
  process.env.SCOPE_EVALS_RESULTS ?? path.join(repoRoot, 'evals/results/scope/latest.json');
const scopeOut = path.join(here, '../lib/generated/scope-evals-latest.json');
const scopeResults = existsSync(scopeSource) ? JSON.parse(readFileSync(scopeSource, 'utf8')) : null;
writeFileSync(scopeOut, `${JSON.stringify(scopeResults, null, 2)}\n`);
console.log(
  scopeResults
    ? `Copied ${path.relative(repoRoot, scopeSource)} (run ${scopeResults.run.started_at})`
    : 'No published Scope eval results; wrote null',
);
