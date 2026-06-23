import { readFile } from "node:fs/promises";

const appSource = await readFile("public/app.js", "utf8");
const stylesSource = await readFile("public/styles.css", "utf8");

const renderRuntimeMatch = appSource.match(/function renderRuntimeStatus\(payload\) \{([\s\S]*?)\n\}/);
if (!renderRuntimeMatch) {
  throw new Error("Could not locate renderRuntimeStatus(payload).");
}

const runtimeBody = renderRuntimeMatch[1];

const requiredRuntimeSnippets = [
  "payload.memory_suggestions",
  "pendingMemory",
  "harness.duration_ms",
  "harness.fallback_used",
  "harness.fallback_reason",
  "modelAdapter.error_code",
  "modelAdapter.http_status",
  "harness.budget_status",
  "budget.step_budget_exceeded",
  "budget.timeout_exceeded",
  "c.chat.fallbackUsed",
  "c.chat.noFallback",
  "c.chat.budgetExceeded",
  "c.chat.budgetOk",
  "safety.risk_types",
  "runtime-status"
];

const missingRuntimeSnippets = requiredRuntimeSnippets.filter((snippet) => {
  return !runtimeBody.includes(snippet);
});

const requiredMemoryActionSnippets = [
  'data-memory-action="confirm"',
  'data-memory-action="ignore"',
  "/api/memory/confirm",
  "/api/memory/forget",
  "JSON.stringify({ suggestionId, projectId: state.project?.id })",
  "const visible = suggestions.slice(0, 3)",
  "item.status === \"pending\"",
  "memory-state",
  "error.code = payload.code || \"REQUEST_FAILED\"",
  "error.status = response.status",
  "error.payload = payload",
  "function showError",
  "showError(error)"
];

const missingMemoryActionSnippets = requiredMemoryActionSnippets.filter((snippet) => {
  return !appSource.includes(snippet);
});

const requiredStyleSnippets = [
  ".runtime-status",
  ".memory-suggestions",
  ".memory-actions",
  ".memory-state"
];

const staleFrontendTerms = [
  "single-agent tool workflow",
  "alert(error.message)",
  "Updated preference memory. Run the agent again to apply it.",
  "memory_used: action === \"confirm\""
].filter((term) => appSource.includes(term));

const missingStyleSnippets = requiredStyleSnippets.filter((snippet) => {
  return !stylesSource.includes(snippet);
});

if (
  missingRuntimeSnippets.length
  || missingMemoryActionSnippets.length
  || missingStyleSnippets.length
  || staleFrontendTerms.length
) {
  console.error(JSON.stringify({
    missingRuntimeSnippets,
    missingMemoryActionSnippets,
    missingStyleSnippets,
    staleFrontendTerms
  }, null, 2));
  throw new Error("Frontend agent UI contract is incomplete.");
}

console.log(JSON.stringify({
  ok: true,
  runtimeSnippets: requiredRuntimeSnippets.length,
  memoryActionSnippets: requiredMemoryActionSnippets.length,
  styleSnippets: requiredStyleSnippets.length
}, null, 2));
