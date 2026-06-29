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
  "harness.run_id",
  "harness.fallback_used",
  "harness.fallback_reason",
  "modelAdapter.error_code",
  "modelAdapter.http_status",
  "harness.budget_status",
  "budget.step_budget_exceeded",
  "budget.timeout_exceeded",
  "budget.context_budget_exceeded",
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

const requiredChatRuntimeSnippets = [
  "function renderOptionalRuntimeStatus",
  "renderOptionalRuntimeStatus(payload)",
  "function renderOnboardingMessage",
  "renderMemorySuggestions(payload.memory_suggestions)",
  "summary.safetyReview",
  "prompt_injection_file_count",
  "sensitive_file_count",
  "state.llmStatus?.llm?.request_timeout_ms",
  "timeoutTitle"
];

const missingChatRuntimeSnippets = requiredChatRuntimeSnippets.filter((snippet) => {
  return !appSource.includes(snippet);
});

const requiredMemoryActionSnippets = [
  'data-memory-action="confirm"',
  'data-memory-action="ignore"',
  'data-memory-forget-key',
  'data-memory-forget-all',
  "/api/memory/confirm",
  "/api/memory/forget",
  "/api/memory?projectId=",
  "function refreshMemory",
  "function renderMemoryManager",
  "function forgetMemoryPreference",
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

const requiredDashboardSnippets = [
  "recent_memory_events",
  "recentMemoryEvents(metrics.recent_memory_events)",
  "c.dashboard.recentMemory",
  "memory_status_counts",
  "safety_status_counts",
  "citation_status_counts",
  "harness_runtime_counts",
  "model_mode_counts",
  "tool_policy_counts",
  "budget_status_counts",
  "schema_status_counts",
  "llm_usage_counts",
  "trace_tool_counts",
  "c.dashboard.memoryStatus",
  "c.dashboard.safetyStatus",
  "c.dashboard.citationStatus",
  "c.dashboard.harnessRuntime",
  "c.dashboard.modelMode",
  "c.dashboard.toolPolicy",
  "c.dashboard.budgetStatus",
  "c.dashboard.schemaStatus",
  "c.dashboard.llmUsage",
  "c.dashboard.traceTools",
  "recent_harness_runs",
  "recentHarnessRuns(metrics.recent_harness_runs)",
  "recent_safety_events",
  "recentSafetyEvents(metrics.recent_safety_events)",
  "c.dashboard.recentSafety",
  "item.guardrails",
  "c.dashboard.recentRuns",
  "item.fallback_used",
  "item.safety_status",
  "item.harness_run_id",
  "item.answer_kind"
];

const missingDashboardSnippets = requiredDashboardSnippets.filter((snippet) => {
  return !appSource.includes(snippet);
});

const requiredStyleSnippets = [
  ".runtime-status",
  ".memory-suggestions",
  ".memory-actions",
  ".memory-state",
  ".memory-manager",
  ".memory-preferences",
  ".memory-clear"
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
  || missingChatRuntimeSnippets.length
  || missingMemoryActionSnippets.length
  || missingDashboardSnippets.length
  || missingStyleSnippets.length
  || staleFrontendTerms.length
) {
  console.error(JSON.stringify({
    missingRuntimeSnippets,
    missingChatRuntimeSnippets,
    missingMemoryActionSnippets,
    missingDashboardSnippets,
    missingStyleSnippets,
    staleFrontendTerms
  }, null, 2));
  throw new Error("Frontend agent UI contract is incomplete.");
}

console.log(JSON.stringify({
  ok: true,
  runtimeSnippets: requiredRuntimeSnippets.length,
  chatRuntimeSnippets: requiredChatRuntimeSnippets.length,
  memoryActionSnippets: requiredMemoryActionSnippets.length,
  dashboardSnippets: requiredDashboardSnippets.length,
  styleSnippets: requiredStyleSnippets.length
}, null, 2));
