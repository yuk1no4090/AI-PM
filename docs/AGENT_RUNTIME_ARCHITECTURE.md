# Agent Runtime Architecture

This document records the first production-shaped implementation boundary for the LangGraph, memory, harness, and AI safety upgrade.

## Scope

- The agent workflow is implemented as a LangGraph `StateGraph`.
- The first memory module is user preference memory only.
- The harness is the runtime boundary around model calls, graph execution, tool policy, budgets, trace, schema validation, fallback, and errors.
- AI safety is application-level guardrails. It is not a compliance certification.

## Graph Nodes

The `/api/agent-impact` workflow executes these nodes in order:

```text
input_safety
  -> memory
  -> classify
  -> retrieve
  -> expand_context
  -> impact_analysis
  -> qa_plan
  -> guardrails
  -> synthesize
```

Each node appends trace metadata so the UI can show the agent path instead of hiding the workflow.

`/api/chat` is not a LangGraph workflow. It uses a lighter `Direct Chat Harness` that reuses the same model adapter, schema validation, trace shape, deterministic fallback, confirmed `memory_used` reporting, read-only tool policy, and input/retrieval/output safety reports. This keeps the existing chat API compatible while making ordinary Q&A and standard impact analysis observable through the same harness fields.

## Memory Boundary

Confirmed memory is stored in `data/store.json` under `userPreferences`. Confirmed preference memory is global for the local app instance, not project-scoped. Memory suggestions carry `projectId` so the UI and API can verify which project produced the suggestion before confirmation or ignore actions.

Non-GET API requests run through an in-process write queue before reading and saving the store. Store saves use a same-directory temporary file followed by rename, so preference, feedback, and trace metadata writes are less likely to lose concurrent updates or leave a partial JSON file if the process is interrupted.

If the store file exists but contains invalid JSON, startup moves it aside with a `.corrupt-` suffix before creating a fresh normalized store. This preserves the damaged file for inspection instead of silently overwriting it.

Supported preference fields:

- `role`
- `language`
- `detailLevel`
- `focusAreas`
- `taskTypes`

Memory suggestions are stored separately under `memorySuggestions`. The system may suggest memory from recent usage, but only `POST /api/memory/confirm` writes the value into long-lived preferences. `POST /api/memory/forget` can ignore one pending suggestion, clear one known preference key, or clear all preferences.

The Copilot inspector uses `GET /api/memory` plus `POST /api/memory/forget` as a lightweight memory manager. It shows confirmed preferences and lets the user remove one key/value pair or clear all preferences without creating a separate page.

Suggestion records are normalized on store load/save so missing ids, timestamps, confidence values, and invalid statuses cannot destabilize the UI or metrics. Only pending suggestions can be confirmed or ignored. Confirm and forget requests may include `projectId`; when supplied, the suggestion must belong to that project or the request is rejected. Unknown preference keys are rejected instead of falling back to full memory deletion. Unknown preference values are rejected instead of writing arbitrary values into long-lived preferences. Ignored suggestions suppress the same key/value suggestion from being repeated. Selective forget clears one preference key while preserving the rest of the confirmed preference memory. Unsafe input does not create new memory suggestions; existing confirmed preferences may still be applied.

Memory API errors return `{ error, code }` so the UI and tests can distinguish user-visible copy from machine-readable state. The memory boundary currently uses `MEMORY_SUGGESTION_NOT_FOUND`, `MEMORY_SUGGESTION_NOT_PENDING`, `MEMORY_PROJECT_MISMATCH`, and `UNKNOWN_MEMORY_PREFERENCE_KEY`.

## modelAdapter

`runModelAdapter()` is the only agent model boundary.

It supports OpenAI-compatible chat completions through:

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`
- `LLM_REQUEST_TIMEOUT_MS`

If no API key is configured, the model adapter reports deterministic offline retrieval. If a model response times out, fails transport, returns a non-2xx HTTP response, returns invalid JSON, or fails schema validation, the workflow uses deterministic fallback and records the failure under `harness.model_adapter.error_code`, `error`, `http_status`, `duration_ms`, and `schema_errors` when applicable. Repository chunks are scanned in raw form for safety, but sensitive-looking values are redacted before the retrieved context is sent to an external model.

## agentHarness

`buildAgentHarnessReport()` creates the public harness payload for `/api/agent-impact`.

`buildChatHarnessReport()` creates the equivalent lightweight payload for `/api/chat`.

The harness reports:

- run id
- runtime
- model mode and provider
- model adapter metadata
- model adapter error code, HTTP status, and call duration
- executed steps
- duration
- fallback status
- fallback reason
- schema status
- budgets
- budget status
- read-only tool registry
- errors

Feedback records preserve `harness_run_id` when the referenced answer payload includes a harness run id, so quality signals can be correlated with the agent or direct chat execution that produced the answer.

`/api/evaluation` derives `recent_harness_runs` from saved answer payloads. Each item includes the run id, answer id, answer kind, runtime, model mode, duration, fallback status, safety status, risk types, and creation time.

The same evaluation payload derives `recent_safety_events` from saved answers with `needs_review` safety status or recorded risk types. Each item includes the answer id, optional run id, answer kind, safety status, risk types, matching guardrails, and creation time.

It also derives `recent_memory_events` from project-owned memory suggestions. Each item includes the suggestion id, preference key/value, display label, status, confidence, and creation time.

`withWorkflowTimeout()` enforces the graph timeout. Timeout failures use the same deterministic fallback path as other workflow failures.

`LLM_REQUEST_TIMEOUT_MS` controls individual model call timeouts for both the LangGraph workflow and the direct chat harness.

## Tool Policy

The first version uses read-only agent tools only. The tool registry forbids:

- repository writes
- shell execution
- external network tools

The trace is checked against the registry before the final response is returned. Unknown or disallowed tools mark safety as `needs_review`.

## AI Safety Boundary

Safety checks run at four levels:

- Import: request bodies, GitHub fetch duration, ZIP byte size, ZIP entry counts, safe relative repository paths, imported file counts, per-file text size, total imported text size, and ZIP structure are bounded before repository content enters analysis.
- Input: prompt injection, secret requests, and write/tool escalation intent.
- Retrieval: instruction-like text and sensitive-looking values inside repository files are treated as untrusted evidence and flagged for review.
- Output: citations must exist in the imported repository, every impact area must cite at least one file, sensitive-looking values are flagged, and no-impact-citation overconfidence is flagged.
- Agent: all trace tools must match the read-only registry.

Repository content is never promoted into system instructions.

## Non-Goals

The first version intentionally does not include:

- database persistence
- vector long-term memory
- LangSmith tracing
- dynamic supervisor routing
- autonomous write tools
- automatic external browsing tools
- compliance certification claims

## Verification Gates

`npm test` runs static checks and smoke tests.

Static checks cover:

- LangGraph dependency and import contract
- API documentation sync
- store schema normalization
- agent response contract
- frontend agent UI contract
- locale key sync
- text quality

Smoke tests cover:

- no-key offline mode
- LangGraph agent execution
- memory confirm, ignore, selective forget, full forget, post-forget behavior, and unsafe-input learning suppression
- input prompt injection and secret request guardrails
- retrieved-context prompt injection guardrails
- retrieved sensitive content guardrails
- API-key mode with fake OpenAI-compatible schema failure
- valid schema with nonexistent citation
- valid schema with uncited impact area
- Q&A and evaluation regressions, including average response time, safety risk type counts, and fallback reason counts
