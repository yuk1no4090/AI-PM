import { readFile } from "node:fs/promises";

const [serverSource, architectureDoc, readme] = await Promise.all([
  readFile("server.js", "utf8"),
  readFile("docs/AGENT_RUNTIME_ARCHITECTURE.md", "utf8"),
  readFile("README.md", "utf8")
]);

const requiredServerSnippets = [
  "function scanInputSafety",
  "risk_type: \"prompt_injection\"",
  "忽略.{0,20}(系统|指令|规则)",
  "risk_type: \"secret_request\"",
  "泄露|密钥|令牌",
  "risk_type: \"tool_permission\"",
  "删除|写入|提交|推送|执行命令",
  "function scanRetrievedSafety",
  "retrieved_prompt_injection",
  "retrieved_sensitive_content",
  "SENSITIVE_VALUE_PATTERN",
  "function redactSensitiveText",
  "SECRET_REDACTION",
  "function scanOutputSafety",
  "const refs = collectCitationFiles(payload)",
  "function isSafeRelativePath",
  "raw.startsWith(\"/\")",
  "part === \"..\"",
  "risk_type: \"missing_citation\"",
  "risk_type: \"sensitive_output\"",
  "risk_type: \"overconfidence\"",
  "hasRequiredCitations",
  "does not clearly mark uncertainty",
  "function validateTraceToolUse",
  "tool_policy_violation"
];

const requiredDocSnippets = [
  "prompt injection",
  "secret requests",
  "write/tool escalation intent",
  "retrieved-context prompt injection",
  "retrieved sensitive content",
  "sensitive-looking values",
  "no-impact-citation overconfidence",
  "read-only registry"
];

const missingServerSnippets = requiredServerSnippets.filter((snippet) => {
  return !serverSource.includes(snippet);
});

const combinedDocs = `${architectureDoc}\n${readme}`;
const missingDocSnippets = requiredDocSnippets.filter((snippet) => {
  return !combinedDocs.includes(snippet);
});

if (missingServerSnippets.length || missingDocSnippets.length) {
  console.error(JSON.stringify({
    missingServerSnippets,
    missingDocSnippets
  }, null, 2));
  throw new Error("Safety guardrail contract is incomplete.");
}

console.log(JSON.stringify({
  ok: true,
  serverSnippets: requiredServerSnippets.length,
  docSnippets: requiredDocSnippets.length
}, null, 2));
