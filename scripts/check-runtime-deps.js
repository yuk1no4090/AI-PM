import { readFile } from "node:fs/promises";

const [packageJsonRaw, packageLockRaw, serverSource, readme] = await Promise.all([
  readFile("package.json", "utf8"),
  readFile("package-lock.json", "utf8"),
  readFile("server.js", "utf8"),
  readFile("README.md", "utf8")
]);

const packageJson = JSON.parse(packageJsonRaw);
const packageLock = JSON.parse(packageLockRaw);

const requiredDependencies = [
  "@langchain/core",
  "@langchain/langgraph"
];

const missingPackageDeps = requiredDependencies.filter((name) => {
  return !packageJson.dependencies?.[name];
});

const rootLockDeps = packageLock.packages?.[""]?.dependencies || {};
const missingLockDeps = requiredDependencies.filter((name) => {
  return !rootLockDeps[name];
});

const requiredSourceSnippets = [
  'from "@langchain/langgraph"',
  "new StateGraph",
  "Annotation.Root"
];

const missingSourceSnippets = requiredSourceSnippets.filter((snippet) => {
  return !serverSource.includes(snippet);
});

const requiredReadmeSnippets = [
  "LangGraph",
  "npm install",
  "OpenAI-compatible",
  "modelAdapter",
  "agentHarness"
];

const missingReadmeSnippets = requiredReadmeSnippets.filter((snippet) => {
  return !readme.includes(snippet);
});

if (
  missingPackageDeps.length
  || missingLockDeps.length
  || missingSourceSnippets.length
  || missingReadmeSnippets.length
) {
  console.error(JSON.stringify({
    missingPackageDeps,
    missingLockDeps,
    missingSourceSnippets,
    missingReadmeSnippets
  }, null, 2));
  throw new Error("Runtime dependency contract is incomplete.");
}

console.log(JSON.stringify({
  ok: true,
  dependencies: requiredDependencies,
  sourceSnippets: requiredSourceSnippets.length,
  readmeSnippets: requiredReadmeSnippets.length
}, null, 2));
