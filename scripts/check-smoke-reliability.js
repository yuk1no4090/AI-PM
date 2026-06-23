import { readFile } from "node:fs/promises";

const [smokeSource, readme] = await Promise.all([
  readFile("scripts/smoke-test.js", "utf8"),
  readFile("README.md", "utf8")
]);

const requiredSnippets = [
  "const REQUEST_TIMEOUT_MS = 20_000",
  "new AbortController()",
  "controller.abort()",
  "function requestTo",
  "function requestError",
  "async function stopChild",
  "child.once(\"exit\"",
  "child.kill(\"SIGKILL\")",
  "async function closeServer",
  "await stopChild(child)",
  "await closeServer(fakeLlm.server)",
  "async function runStorePathSmoke",
  "STORE_PATH: storePath",
  "customStorePathCreated",
  "async function runCorruptStoreBackupSmoke",
  "corruptStoreBackedUp"
];

const stalePatterns = [
  {
    name: "direct child.kill in finally",
    pattern: /finally\s*\{[^}]*child\.kill\(\);/s
  },
  {
    name: "direct fakeLlm.server.close in finally",
    pattern: /finally\s*\{[^}]*fakeLlm\.server\.close\(\);/s
  }
];

const missingSnippets = requiredSnippets.filter((snippet) => !smokeSource.includes(snippet));
const requiredReadmeSnippets = [
  "smoke reliability checks",
  "Smoke requests use explicit timeouts and wait for spawned servers to exit during cleanup"
];
const missingReadmeSnippets = requiredReadmeSnippets.filter((snippet) => !readme.includes(snippet));
const staleMatches = stalePatterns
  .filter(({ pattern }) => pattern.test(smokeSource))
  .map(({ name }) => name);

if (missingSnippets.length || missingReadmeSnippets.length || staleMatches.length) {
  console.error(JSON.stringify({
    missingSnippets,
    missingReadmeSnippets,
    staleMatches
  }, null, 2));
  throw new Error("Smoke test reliability contract is incomplete.");
}

console.log(JSON.stringify({
  ok: true,
  reliabilitySnippets: requiredSnippets.length,
  readmeSnippets: requiredReadmeSnippets.length
}, null, 2));
