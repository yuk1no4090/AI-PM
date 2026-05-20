import http from "node:http";
import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const ALLOWED_EXTENSIONS = new Set([
  ".md",
  ".txt",
  ".js",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".json",
  ".yaml",
  ".yml"
]);

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
  ".turbo",
  ".cache",
  "vendor"
]);

const SAMPLE_FILES = [
  {
    path: "README.md",
    content: `# Commerce API

Commerce API is a Node.js backend for users, products, orders, payments, coupons, and refunds.

## Startup
npm install
npm run dev

## Authentication
Clients call POST /api/login. The auth route validates credentials, issues a JWT, and returns the token to the client.

## Business flows
Orders are created from cart items, then paid through the payment service. Refunds can update order status after payment settlement.`
  },
  {
    path: "src/routes/auth.ts",
    content: `import { authService } from "../services/authService";

export async function loginRoute(req, res) {
  const { email, password } = req.body;
  const user = await authService.validateUser(email, password);
  if (!user) return res.status(401).json({ error: "invalid_credentials" });
  const token = authService.issueJwt(user);
  return res.json({ token, userId: user.id });
}`
  },
  {
    path: "src/services/authService.ts",
    content: `export const authService = {
  async validateUser(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) return null;
    return passwordHasher.compare(password, user.passwordHash) ? user : null;
  },
  issueJwt(user) {
    return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET);
  }
};`
  },
  {
    path: "src/models/order.ts",
    content: `export type OrderStatus =
  | "draft"
  | "pending_payment"
  | "paid"
  | "cancelled"
  | "refunded";

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  couponCode?: string;
}`
  },
  {
    path: "src/routes/order.ts",
    content: `import { orderService } from "../services/orderService";

export async function createOrderRoute(req, res) {
  const order = await orderService.createOrder(req.user.id, req.body.items, req.body.couponCode);
  return res.status(201).json(order);
}

export async function cancelOrderRoute(req, res) {
  const order = await orderService.cancelOrder(req.params.orderId, req.user.id);
  return res.json(order);
}`
  },
  {
    path: "src/services/orderService.ts",
    content: `export const orderService = {
  async createOrder(userId: string, items: CartItem[], couponCode?: string) {
    const pricedItems = await productService.priceItems(items);
    const discount = couponCode ? await couponService.validateCoupon(couponCode, userId) : 0;
    return orderRepository.create({
      userId,
      items: pricedItems,
      totalAmount: calculateTotal(pricedItems, discount),
      status: "pending_payment"
    });
  },
  async markPaid(orderId: string) {
    return orderRepository.updateStatus(orderId, "paid");
  },
  async cancelOrder(orderId: string, userId: string) {
    const order = await orderRepository.findById(orderId);
    if (order.userId !== userId || order.status === "paid") throw new Error("cannot_cancel");
    return orderRepository.updateStatus(orderId, "cancelled");
  }
};`
  },
  {
    path: "src/services/paymentService.ts",
    content: `export const paymentService = {
  async chargeOrder(orderId: string, paymentMethodId: string) {
    const order = await orderRepository.findById(orderId);
    const result = await paymentGateway.charge(order.totalAmount, paymentMethodId);
    if (result.status === "succeeded") {
      await orderService.markPaid(orderId);
    }
    if (result.status === "failed") {
      await paymentRepository.recordFailure(orderId, result.failureCode);
    }
    return result;
  }
};`
  },
  {
    path: "src/services/refundService.ts",
    content: `export const refundService = {
  async refundOrder(orderId: string, amount: number) {
    const order = await orderRepository.findById(orderId);
    if (order.status !== "paid") throw new Error("order_not_paid");
    const refund = await paymentGateway.refund(orderId, amount);
    if (refund.fullRefund) {
      await orderRepository.updateStatus(orderId, "refunded");
    }
    return refund;
  }
};`
  },
  {
    path: "src/services/couponService.ts",
    content: `export const couponService = {
  async validateCoupon(code: string, userId: string) {
    const coupon = await couponRepository.findActiveByCode(code);
    if (!coupon) throw new Error("invalid_coupon");
    if (coupon.usedBy.includes(userId)) throw new Error("coupon_already_used");
    return coupon.amountOff;
  }
};`
  },
  {
    path: "src/pages/order-detail.tsx",
    content: `export function OrderDetail({ order }) {
  return (
    <section>
      <h1>Order {order.id}</h1>
      <span data-status={order.status}>{order.status}</span>
      <strong>{order.totalAmount}</strong>
    </section>
  );
}`
  },
  {
    path: "tests/order.test.ts",
    content: `describe("orders", () => {
  it("creates pending payment orders", async () => {});
  it("does not cancel paid orders", async () => {});
  it("marks paid orders after successful payment", async () => {});
});`
  }
];

let writeQueue = Promise.resolve();

async function withWriteLock(task) {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => {});
  return run;
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    const seed = { projects: [], questions: [], answers: [], feedback: [] };
    await fs.writeFile(STORE_PATH, JSON.stringify(seed, null, 2));
    return seed;
  }
}

async function saveStore(store) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 30 * 1024 * 1024) {
        reject(new Error("Request body is too large. Keep ZIP uploads under 30MB for the MVP."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function normalizeRepoPath(filePath) {
  return filePath
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .join("/");
}

function shouldIncludeFile(filePath) {
  const normalized = normalizeRepoPath(filePath);
  const parts = normalized.split("/");
  if (parts.some((part) => IGNORE_DIRS.has(part))) return false;
  return ALLOWED_EXTENSIONS.has(path.extname(normalized).toLowerCase());
}

function stripArchiveRoot(filePath) {
  const parts = normalizeRepoPath(filePath).split("/");
  if (parts.length > 1 && /^[^/]+-[a-f0-9]{6,}$|^[^/]+-(main|master|trunk|develop)$/i.test(parts[0])) {
    return parts.slice(1).join("/");
  }
  return normalizeRepoPath(filePath);
}

function parseZip(buffer) {
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= 0; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("Invalid ZIP: end of central directory not found.");

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirOffset = buffer.readUInt32LE(eocdOffset + 16);
  const files = [];
  let offset = centralDirOffset;

  for (let i = 0; i < totalEntries; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.slice(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    offset += 46 + fileNameLength + extraLength + commentLength;

    if (fileName.endsWith("/")) continue;
    const cleanPath = stripArchiveRoot(fileName);
    if (!shouldIncludeFile(cleanPath)) continue;
    if (compressedSize > 800_000) continue;

    if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) continue;
    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.slice(dataStart, dataStart + compressedSize);

    let contentBuffer;
    if (compressionMethod === 0) {
      contentBuffer = compressed;
    } else if (compressionMethod === 8) {
      contentBuffer = zlib.inflateRawSync(compressed);
    } else {
      continue;
    }

    const content = contentBuffer.toString("utf8").replace(/\u0000/g, "");
    if (content.trim()) files.push({ path: cleanPath, content });
  }

  return files;
}

async function fetchGithubZip(repoUrl) {
  const match = repoUrl.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  if (!match) throw new Error("Enter a valid GitHub repository URL.");
  const owner = match[1];
  const repo = match[2].replace(/\.git$/, "");

  const metaResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { "user-agent": "ai-developer-onboarding-copilot" }
  });
  if (!metaResponse.ok) throw new Error(`GitHub repository lookup failed: ${metaResponse.status}`);
  const meta = await metaResponse.json();
  const branch = meta.default_branch || "main";
  const zipResponse = await fetch(`https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${branch}`, {
    headers: { "user-agent": "ai-developer-onboarding-copilot" }
  });
  if (!zipResponse.ok) throw new Error(`GitHub ZIP download failed: ${zipResponse.status}`);
  const buffer = Buffer.from(await zipResponse.arrayBuffer());
  return {
    files: parseZip(buffer),
    repoName: repo,
    source: `github:${owner}/${repo}`
  };
}

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9_./-]+|[\u4e00-\u9fa5]+/g) || [])
    .filter((term) => term.length > 1 && !["the", "and", "for", "with", "from", "this", "that"].includes(term));
}

function expandQueryTerms(query) {
  const terms = tokenize(query);
  const lower = query.toLowerCase();
  const expansions = [
    [["登录", "认证", "用户"], ["auth", "login", "user", "jwt", "password"]],
    [["订单", "下单", "创建订单"], ["order", "checkout", "createorder", "orderstatus"]],
    [["支付", "付款"], ["payment", "charge", "paid", "gateway"]],
    [["退款", "退货"], ["refund", "refunded", "refundservice"]],
    [["优惠券", "折扣"], ["coupon", "discount", "validatecoupon"]],
    [["状态", "字段"], ["status", "type", "model", "schema"]],
    [["测试", "场景", "边界"], ["test", "spec", "scenario", "failure"]],
    [["新人", "入门", "学习"], ["readme", "onboarding", "first", "read", "module"]],
    [["接口", "路由"], ["api", "route", "controller", "endpoint"]],
    [["影响", "修改", "新增"], ["impact", "change", "service", "model", "test"]]
  ];
  expansions.forEach(([needles, words]) => {
    if (needles.some((needle) => lower.includes(needle))) terms.push(...words);
  });
  return [...new Set(terms)];
}

function chunkFile(file) {
  const lines = file.content.split(/\r?\n/);
  const chunks = [];
  let current = [];
  let startLine = 1;
  let charCount = 0;

  lines.forEach((line, index) => {
    current.push(line);
    charCount += line.length + 1;
    const shouldFlush = current.length >= 70 || charCount > 3500 || index === lines.length - 1;
    if (shouldFlush) {
      const content = current.join("\n").trim();
      if (content) {
        chunks.push({
          id: crypto.randomUUID(),
          file_path: file.path,
          file_type: path.extname(file.path).slice(1) || "txt",
          chunk_index: chunks.length,
          start_line: startLine,
          end_line: index + 1,
          content,
          terms: tokenize(`${file.path}\n${content}`)
        });
      }
      current = [];
      startLine = index + 2;
      charCount = 0;
    }
  });

  return chunks;
}

function inferTechStack(files) {
  const names = files.map((file) => file.path.toLowerCase());
  const content = files.map((file) => `${file.path}\n${file.content.slice(0, 4000)}`).join("\n").toLowerCase();
  const stack = [];
  if (names.some((name) => name.endsWith("package.json")) || names.some((name) => /\.(ts|tsx|js)$/.test(name))) stack.push("Node.js / JavaScript");
  if (names.some((name) => name.endsWith(".ts") || name.endsWith(".tsx")) || content.includes("typescript")) stack.push("TypeScript");
  if (names.some((name) => name.endsWith(".tsx")) || content.includes("react")) stack.push("React");
  if (content.includes("next")) stack.push("Next.js");
  if (names.some((name) => name.endsWith(".py")) || content.includes("fastapi") || content.includes("django")) stack.push("Python");
  if (content.includes("fastapi")) stack.push("FastAPI");
  if (names.some((name) => name.endsWith(".java")) || content.includes("springframework")) stack.push("Java");
  if (content.includes("express")) stack.push("Express");
  if (content.includes("tailwind")) stack.push("Tailwind CSS");
  if (content.includes("prisma")) stack.push("Prisma");
  if (content.includes("postgres") || content.includes("pgvector")) stack.push("PostgreSQL");
  return [...new Set(stack)].slice(0, 8);
}

function buildTree(files) {
  const root = {};
  files.forEach((file) => {
    const parts = file.path.split("/");
    let node = root;
    parts.forEach((part, index) => {
      node[part] ||= index === parts.length - 1 ? null : {};
      if (node[part]) node = node[part];
    });
  });

  function render(node, depth = 0) {
    return Object.keys(node)
      .sort((a, b) => {
        const aDir = node[a] !== null;
        const bDir = node[b] !== null;
        if (aDir !== bDir) return aDir ? -1 : 1;
        return a.localeCompare(b);
      })
      .slice(0, depth === 0 ? 16 : 12)
      .flatMap((key) => {
        const prefix = `${"  ".repeat(depth)}- ${key}`;
        if (node[key] === null || depth >= 2) return [prefix];
        return [prefix, ...render(node[key], depth + 1)];
      });
  }

  return render(root).join("\n");
}

function detectBusinessFeatures(files) {
  const catalog = [
    ["Authentication", ["auth", "login", "jwt", "session", "password"]],
    ["Users", ["user", "profile", "account"]],
    ["Orders", ["order", "checkout"]],
    ["Payments", ["payment", "charge", "paid", "gateway"]],
    ["Refunds", ["refund", "refunded"]],
    ["Coupons", ["coupon", "discount", "promo"]],
    ["Products", ["product", "sku", "catalog"]],
    ["Admin", ["admin", "backoffice"]],
    ["Testing", ["test", "spec", "scenario"]]
  ];
  const haystack = files.map((file) => `${file.path}\n${file.content.slice(0, 2500)}`).join("\n").toLowerCase();
  return catalog
    .filter(([, terms]) => terms.some((term) => haystack.includes(term)))
    .map(([name]) => name);
}

function summarizeReadme(files) {
  const readme = files.find((file) => /(^|\/)readme\.md$/i.test(file.path));
  if (!readme) return "No README.md was found in the imported repository.";
  const text = readme.content
    .replace(/```[\s\S]*?```/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^#+\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 8)
    .join(" ");
  return text.slice(0, 700) || "README.md exists but does not contain enough readable text for a summary.";
}

function recommendFiles(files) {
  const scored = files.map((file) => {
    const lower = file.path.toLowerCase();
    let score = 0;
    if (/readme\.md$/.test(lower)) score += 100;
    if (lower.includes("route") || lower.includes("controller")) score += 30;
    if (lower.includes("service")) score += 25;
    if (lower.includes("model") || lower.includes("schema")) score += 20;
    if (lower.includes("order") || lower.includes("auth") || lower.includes("payment")) score += 12;
    if (lower.includes("test") || lower.includes("spec")) score += 8;
    return { path: file.path, score };
  });
  return scored
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .filter((item) => item.score > 0)
    .slice(0, 8)
    .map((item) => item.path);
}

function createProject({ name, source, files }) {
  const limitedFiles = files
    .filter((file) => shouldIncludeFile(file.path))
    .slice(0, 450)
    .map((file) => ({ path: normalizeRepoPath(file.path), content: file.content.slice(0, 400_000) }));

  if (limitedFiles.length === 0) {
    throw new Error("No supported source or documentation files were found.");
  }

  const chunks = limitedFiles.flatMap(chunkFile);
  const techStack = inferTechStack(limitedFiles);
  const businessFeatures = detectBusinessFeatures(limitedFiles);
  const recommendedFiles = recommendFiles(limitedFiles);
  const project = {
    id: crypto.randomUUID(),
    name,
    source,
    createdAt: new Date().toISOString(),
    fileCount: limitedFiles.length,
    chunkCount: chunks.length,
    files: limitedFiles.map((file) => ({
      path: file.path,
      type: path.extname(file.path).slice(1) || "txt",
      size: Buffer.byteLength(file.content)
    })),
    chunks,
    summary: {
      techStack,
      directoryTree: buildTree(limitedFiles),
      coreModules: businessFeatures.length ? businessFeatures : ["Documentation", "Source code"],
      businessFeatures,
      readmeSummary: summarizeReadme(limitedFiles),
      recommendedFiles,
      overview: buildOverview(name, techStack, businessFeatures, recommendedFiles)
    }
  };
  return project;
}

function buildOverview(name, techStack, businessFeatures, recommendedFiles) {
  const stack = techStack.length ? techStack.join(", ") : "the imported files";
  const modules = businessFeatures.length ? businessFeatures.join(", ") : "the visible code and documentation";
  const reads = recommendedFiles.slice(0, 4).join(", ");
  return `${name} appears to use ${stack}. The main visible domains are ${modules}. Recommended first reads: ${reads || "README and top-level source files"}.`;
}

function findProject(store, projectId) {
  const project = store.projects.find((item) => item.id === projectId) || store.projects.at(-1);
  if (!project) throw new Error("Import a repository before using this feature.");
  return project;
}

function retrieveChunks(project, query, topK = 8) {
  const queryTerms = expandQueryTerms(query);
  const querySet = new Set(queryTerms);
  const phrase = query.toLowerCase();

  return project.chunks
    .map((chunk) => {
      const termCounts = new Map();
      chunk.terms.forEach((term) => termCounts.set(term, (termCounts.get(term) || 0) + 1));
      let score = 0;
      querySet.forEach((term) => {
        const count = termCounts.get(term) || 0;
        if (count) score += Math.min(count, 6) * (chunk.file_path.toLowerCase().includes(term) ? 3 : 1);
      });
      if (phrase && chunk.content.toLowerCase().includes(phrase)) score += 20;
      if (queryTerms.some((term) => chunk.file_path.toLowerCase().includes(term))) score += 8;
      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function extractSymbols(content) {
  const symbols = [];
  const patterns = [
    /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/g,
    /(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(/g,
    /(?:class|interface|type)\s+([A-Za-z0-9_]+)/g,
    /([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{/g
  ];
  patterns.forEach((pattern) => {
    for (const match of content.matchAll(pattern)) symbols.push(match[1]);
  });
  return [...new Set(symbols)].slice(0, 6);
}

function relatedFilesFromChunks(chunks) {
  const seen = new Map();
  chunks.forEach((chunk) => {
    if (!seen.has(chunk.file_path)) {
      const symbols = extractSymbols(chunk.content);
      seen.set(chunk.file_path, {
        file_path: chunk.file_path,
        reason: symbols.length
          ? `Relevant symbols: ${symbols.join(", ")}`
          : `Relevant lines ${chunk.start_line}-${chunk.end_line}`
      });
    }
  });
  return [...seen.values()].slice(0, 8);
}

function inferQuestionType(question) {
  const lower = question.toLowerCase();
  if (/impact|affect|change|add|modify|新增|修改|影响|状态|字段/.test(lower)) return "impact";
  if (/onboard|学习|新人|first week|read first/.test(lower)) return "onboarding";
  return "qa";
}

function loadEnvFile() {
  try {
    const content = readFileSync(path.join(ROOT, ".env"), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
    console.log("[env] Loaded .env file.");
  } catch {
    // .env file is optional
  }
}

loadEnvFile();

function resolveLlmEndpoint() {
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com").replace(/\/+$/, "");
  return `${base}/v1/chat/completions`;
}

function resolveLlmModel() {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

function resolveLlmProvider() {
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com").replace(/\/+$/, "");
  if (base.includes("deepseek")) return "DeepSeek";
  if (base.includes("groq")) return "Groq";
  if (base.includes("openai")) return "OpenAI";
  if (base.includes("anthropic")) return "Anthropic (via compatible endpoint)";
  if (base.includes("ollama") || base.includes("localhost") || base.includes("127.0.0.1")) return "Local Model";
  return "OpenAI-compatible";
}

async function maybeCallOpenAI({ question, chunks, kind, project }) {
  if (!process.env.OPENAI_API_KEY) {
    console.log("[LLM] No OPENAI_API_KEY set — using deterministic retrieval-based answers.");
    return null;
  }

  const endpoint = resolveLlmEndpoint();
  const model = resolveLlmModel();
  const provider = resolveLlmProvider();
  console.log(`[LLM] Calling ${provider} (${model}) at ${endpoint}`);

  const context = chunks.map((chunk, index) => {
    return `[${index + 1}] ${chunk.file_path}:${chunk.start_line}-${chunk.end_line}\n${chunk.content}`;
  }).join("\n\n");

  const schemaInstruction = kind === "impact"
    ? "Return JSON with summary, impact_areas, testing_suggestions, open_questions."
    : "Return JSON with answer, key_points, related_files, uncertainty, suggested_next_questions.";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an AI Developer Onboarding Copilot.
Your job is to help engineers, product managers, and QA understand a codebase.
Rules:
1. Answer only based on the provided repository context.
2. Always cite file paths when making claims.
3. If the context is insufficient, say that you are not sure.
4. Do not invent files, functions, APIs, or business logic.
5. For code change questions, provide impact analysis and testing suggestions.
6. For onboarding questions, provide a structured learning path.
7. Keep answers practical and product-oriented.
${schemaInstruction}`
          },
          {
            role: "user",
            content: `Project: ${project.name}
Question: ${question}

Repository context:
${context}`
          }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown error");
      console.error(`[LLM] ${provider} returned ${response.status}: ${errorText.slice(0, 300)}`);
      return null;
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      console.error(`[LLM] ${provider} returned empty content.`);
      return null;
    }

    const parsed = JSON.parse(content);
    console.log(`[LLM] ${provider} answered successfully (${content.length} chars).`);
    return parsed;
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === "AbortError") {
      console.error(`[LLM] ${provider} request timed out after 30s.`);
    } else {
      console.error(`[LLM] ${provider} request failed: ${error.message}`);
    }
    return null;
  }
}

function generateQaAnswer(question, chunks) {
  const relatedFiles = relatedFilesFromChunks(chunks);
  if (chunks.length === 0) {
    return {
      answer: "I could not find enough repository context to answer this confidently.",
      key_points: ["No matching chunks were retrieved from the imported files."],
      related_files: [],
      uncertainty: "High. Ask a more specific question or import a repository with source files and documentation.",
      suggested_next_questions: [
        "What files should I read first?",
        "What are the main modules in this repository?"
      ]
    };
  }

  const keyPoints = chunks.slice(0, 5).map((chunk) => {
    const symbols = extractSymbols(chunk.content);
    const symbolText = symbols.length ? ` Symbols found: ${symbols.join(", ")}.` : "";
    return `${chunk.file_path} contains matching context around lines ${chunk.start_line}-${chunk.end_line}.${symbolText}`;
  });

  return {
    answer: `Based on the retrieved repository context, the most relevant evidence for "${question}" is concentrated in ${relatedFiles.map((file) => file.file_path).join(", ")}. The answer should be treated as code-grounded: inspect those files first, especially the cited symbols and line ranges.`,
    key_points: keyPoints,
    related_files: relatedFiles,
    uncertainty: chunks.length < 3
      ? "Medium to high. Only a small amount of matching repository context was retrieved."
      : "Low to medium. The answer is based on retrieved files, but runtime behavior may depend on code outside the top matches.",
    suggested_next_questions: [
      "Which functions are most important here?",
      "What tests should cover this behavior?",
      "What would be impacted if this logic changes?"
    ]
  };
}

function generateImpactAnswer(question, chunks, project) {
  const related = relatedFilesFromChunks(chunks);
  const areas = [];
  const areaRules = [
    ["Data Model", ["model", "schema", "type", "interface", "entity"]],
    ["API Routes", ["route", "controller", "api", "endpoint"]],
    ["Business Logic", ["service", "usecase", "workflow"]],
    ["Persistence", ["repository", "database", "migration", "prisma"]],
    ["UI / Presentation", ["page", "component", "view", "tsx"]],
    ["Tests", ["test", "spec", "__tests__"]]
  ];

  areaRules.forEach(([area, terms]) => {
    const files = related
      .filter((file) => terms.some((term) => file.file_path.toLowerCase().includes(term) || file.reason.toLowerCase().includes(term)))
      .map((file) => file.file_path);
    if (files.length) {
      areas.push({
        area,
        files,
        risk_level: area === "Data Model" || area === "Business Logic" ? "high" : "medium",
        reason: `${area} files matched the requested change and may need coordinated updates.`
      });
    }
  });

  if (areas.length === 0 && related.length) {
    areas.push({
      area: "Relevant Code Paths",
      files: related.map((file) => file.file_path),
      risk_level: "medium",
      reason: "The retriever found these files as the closest available evidence for the requested change."
    });
  }

  const risk = areas.some((area) => area.risk_level === "high") ? "medium-high" : "medium";
  return {
    summary: `Requested change: ${question}. Based on ${project.name}, this looks like a ${risk} risk change because it may touch data shape, business flow, UI display, and tests depending on the cited files.`,
    impact_areas: areas,
    testing_suggestions: [
      "Add or update unit tests around the changed status, field, or branch.",
      "Test the happy path and failure path for every cited service or route.",
      "Verify UI display, filters, and empty states if presentation files are cited.",
      "Run regression tests for adjacent flows such as create, update, cancel, refund, or payment where applicable."
    ],
    open_questions: [
      "Is the new behavior backwards compatible with existing persisted data?",
      "Are there analytics, reports, or admin filters that depend on this value?",
      "Should API clients receive a versioned response or migration notice?"
    ]
  };
}

function classifyChangeRequest(question) {
  const lower = question.toLowerCase();
  const entities = [...new Set([
    ...(lower.match(/[a-z]+(?:_[a-z]+)+/g) || []),
    ...(lower.match(/\/api\/[a-z0-9_/-]+/g) || [])
  ])].slice(0, 6);
  let change_type = "business_logic_change";
  if (/status|状态|state/.test(lower)) change_type = "state_or_status_change";
  if (/field|schema|model|字段|数据|表/.test(lower)) change_type = "data_model_change";
  if (/api|endpoint|route|接口/.test(lower)) change_type = "api_contract_change";
  if (/ui|page|component|页面|前端|展示/.test(lower)) change_type = "ui_behavior_change";
  if (/test|qa|测试/.test(lower)) change_type = "test_scope_change";

  const risk_drivers = [
    /status|状态|state/.test(lower) ? "state transitions" : null,
    /payment|refund|order|支付|退款|订单/.test(lower) ? "money or order workflow" : null,
    /api|接口|schema|field|字段/.test(lower) ? "contract or data shape" : null,
    /ui|页面|admin|后台/.test(lower) ? "presentation and filtering" : null
  ].filter(Boolean);

  return {
    change_type,
    entities,
    confidence: risk_drivers.length ? "medium-high" : "medium",
    risk_drivers: risk_drivers.length ? risk_drivers : ["repository context required"]
  };
}

function uniqueChunks(chunks) {
  const seen = new Map();
  chunks.forEach((chunk) => {
    if (!seen.has(chunk.id)) seen.set(chunk.id, chunk);
  });
  return [...seen.values()];
}

function expandImpactChunks(project, question, primaryChunks, classification) {
  const expansionQuery = [
    question,
    classification.change_type,
    classification.entities.join(" "),
    "model schema type status service route controller page component test spec payment refund order"
  ].join(" ");
  return uniqueChunks([
    ...primaryChunks,
    ...retrieveChunks(project, expansionQuery, 14)
  ]).slice(0, 14);
}

function validateAgentCitations(project, payload) {
  const knownFiles = new Set(project.files.map((file) => file.path));
  const citedFiles = [
    ...(payload.related_files || []).map((file) => file.file_path || file),
    ...(payload.impact_areas?.flatMap((area) => area.files || []) || [])
  ].filter(Boolean);
  const missingFiles = citedFiles.filter((file) => !knownFiles.has(file));
  return {
    passed: citedFiles.length > 0 && missingFiles.length === 0,
    cited_file_count: new Set(citedFiles).size,
    missing_files: [...new Set(missingFiles)]
  };
}

function makeTraceStep({ step, tool, purpose, input, output, citations = [] }) {
  return {
    step,
    tool,
    purpose,
    input,
    output,
    citations: citations.slice(0, 6)
  };
}

function runAgenticImpactWorkflow(project, question) {
  const classification = classifyChangeRequest(question);
  const primaryChunks = retrieveChunks(project, question, 8);
  const expandedChunks = expandImpactChunks(project, question, primaryChunks, classification);
  const relatedFiles = relatedFilesFromChunks(expandedChunks);
  const impact = generateImpactAnswer(question, expandedChunks, project);
  const riskLevel = impact.impact_areas.some((area) => area.risk_level === "high")
    ? "high"
    : impact.impact_areas.some((area) => area.risk_level === "medium")
      ? "medium"
      : "low";
  const guardrails = validateAgentCitations(project, {
    related_files: relatedFiles,
    impact_areas: impact.impact_areas
  });

  const trace = [
    makeTraceStep({
      step: "1. Classify change request",
      tool: "classify_change_request",
      purpose: "Identify the kind of change before retrieval so the workflow can search adjacent risk areas.",
      input: question,
      output: classification
    }),
    makeTraceStep({
      step: "2. Retrieve primary evidence",
      tool: "retrieve_repository_chunks",
      purpose: "Find the top repository chunks directly related to the user request.",
      input: { top_k: 8, query: question },
      output: { chunks_found: primaryChunks.length },
      citations: relatedFilesFromChunks(primaryChunks).map((file) => file.file_path)
    }),
    makeTraceStep({
      step: "3. Expand dependency search",
      tool: "expand_dependency_context",
      purpose: "Search models, routes, services, UI, and tests that may be indirectly affected.",
      input: { change_type: classification.change_type, risk_drivers: classification.risk_drivers },
      output: { total_context_chunks: expandedChunks.length },
      citations: relatedFiles.map((file) => file.file_path)
    }),
    makeTraceStep({
      step: "4. Estimate risk and impacted areas",
      tool: "estimate_impact_risk",
      purpose: "Group cited files by likely impact area and assign risk levels.",
      input: { cited_files: relatedFiles.map((file) => file.file_path) },
      output: { risk_level: riskLevel, impact_area_count: impact.impact_areas.length },
      citations: impact.impact_areas.flatMap((area) => area.files || [])
    }),
    makeTraceStep({
      step: "5. Run citation guardrail",
      tool: "validate_citations",
      purpose: "Prevent unsupported impact claims by checking that cited files exist in the imported repository.",
      input: { required: "Every impact area must cite repository files." },
      output: guardrails,
      citations: relatedFiles.map((file) => file.file_path)
    }),
    makeTraceStep({
      step: "6. Finalize product-ready output",
      tool: "compose_structured_answer",
      purpose: "Return a PM-friendly impact summary, test suggestions, and open questions.",
      input: { answer_contract: ["summary", "impact_areas", "testing_suggestions", "open_questions", "trace"] },
      output: { testing_suggestions: impact.testing_suggestions.length, open_questions: impact.open_questions.length }
    })
  ];

  return {
    agent: {
      name: "Impact Analysis Agent",
      pattern: "single-agent tool workflow",
      framework_concepts: ["instructions", "tools", "state", "trace", "guardrails", "structured output"],
      instructions: [
        "Ground every claim in repository context.",
        "Cite file paths for impact areas.",
        "Use guardrails before finalizing.",
        "Surface open questions when evidence is incomplete."
      ]
    },
    summary: impact.summary,
    trace,
    related_files: relatedFiles,
    impact_areas: impact.impact_areas,
    testing_suggestions: impact.testing_suggestions,
    open_questions: impact.open_questions,
    guardrails: [
      {
        name: "Citation coverage",
        status: guardrails.passed ? "passed" : "needs_review",
        detail: guardrails.passed
          ? `${guardrails.cited_file_count} cited repository files validated.`
          : `Missing or unsupported citations: ${guardrails.missing_files.join(", ") || "none found"}.`
      },
      {
        name: "Uncertainty policy",
        status: expandedChunks.length >= 3 ? "passed" : "needs_review",
        detail: expandedChunks.length >= 3
          ? "Enough context was retrieved for a directional impact analysis."
          : "Retrieved evidence is thin; the answer should be treated as exploratory."
      }
    ],
    uncertainty: expandedChunks.length >= 3
      ? "Low to medium. The workflow found repository evidence, but dependency graphs and runtime behavior may reveal more impact."
      : "High. The agent could not retrieve enough repository context for a confident analysis."
  };
}

function generateOnboardingPlan(project, role, duration) {
  const days = duration === "5 days" ? 5 : 3;
  const recommended = project.summary.recommendedFiles.length
    ? project.summary.recommendedFiles
    : project.files.slice(0, 8).map((file) => file.path);
  const roleFocus = {
    "Backend Engineer": ["startup and architecture", "routes, services, and data models", "core business flow and tests", "error handling and integrations", "first scoped change plan"],
    "Frontend Engineer": ["app structure and UI entry points", "pages and components", "API contracts and states", "edge cases and design gaps", "first scoped UI improvement"],
    "Product Manager": ["product context and modules", "business flows and APIs", "state changes and risks", "metrics and user scenarios", "requirements and rollout plan"],
    QA: ["business rules and critical flows", "test files and edge cases", "failure paths and data states", "regression matrix", "test plan review"]
  };
  const focus = roleFocus[role] || roleFocus["Backend Engineer"];

  return {
    role,
    duration,
    goal: `Understand ${project.name}'s core structure, business flows, risks, and first practical contribution path.`,
    plan: Array.from({ length: days }, (_, index) => ({
      day: `Day ${index + 1}`,
      focus: focus[index] || focus.at(-1),
      files_to_read: recommended.slice(index, index + 4),
      tasks: [
        "Read the cited files and write down unclear concepts.",
        "Map the flow from entry point to service/model/test where possible.",
        index === days - 1 ? "Produce a short summary with risks, open questions, and next actions." : "Ask the copilot one follow-up question with citations."
      ]
    }))
  };
}

function computeMetrics(store, projectId) {
  const questions = store.questions.filter((item) => item.projectId === projectId);
  const answers = store.answers.filter((item) => item.projectId === projectId);
  const feedback = store.feedback.filter((item) => item.projectId === projectId);
  const helpful = feedback.filter((item) => item.type === "helpful").length;
  const negativeTypes = new Set(["not_helpful", "inaccurate", "missing_citation", "too_generic"]);
  const negative = feedback.filter((item) => negativeTypes.has(item.type)).length;
  const cited = answers.filter((item) => {
    const refs = [
      ...(item.payload?.related_files || []).map((file) => file.file_path || file),
      ...(item.payload?.impact_areas?.flatMap((area) => area.files || []) || []),
      ...(item.payload?.plan?.flatMap((day) => day.files_to_read || []) || []),
      ...(item.payload?.trace?.flatMap((step) => step.citations || []) || [])
    ].filter(Boolean);
    return refs.length > 0;
  }).length;
  const uncertain = answers.filter((item) => {
    const u = item.payload?.uncertainty;
    if (u === true || u === "true") return true;
    return /high|not sure|insufficient|不确定/i.test(String(u || ""));
  }).length;
  const counts = feedback.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});
  return {
    total_questions: questions.length,
    helpful_rate: feedback.length ? Math.round((helpful / feedback.length) * 100) : 0,
    citation_coverage: answers.length ? Math.round((cited / answers.length) * 100) : 0,
    uncertain_answer_rate: answers.length ? Math.round((uncertain / answers.length) * 100) : 0,
    negative_feedback_rate: feedback.length ? Math.round((negative / feedback.length) * 100) : 0,
    agent_runs: answers.filter((item) => item.kind === "agent_impact").length,
    high_risk_questions: answers.filter((item) => JSON.stringify(item.payload).includes("high")).length,
    top_failure_reasons: Object.entries(counts)
      .filter(([type]) => type !== "helpful")
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([type, count]) => ({ type, count })),
    recent_feedback: feedback.slice(-8).reverse()
  };
}

async function handleApi(req, res, pathname) {
  if (req.method !== "GET") {
    return withWriteLock(() => handleApiUnlocked(req, res, pathname));
  }
  return handleApiUnlocked(req, res, pathname);
}

async function handleApiUnlocked(req, res, pathname) {
  try {
    const store = await ensureStore();

    if (req.method === "GET" && pathname === "/api/projects") {
      sendJson(res, 200, {
        projects: store.projects.map((project) => ({
          id: project.id,
          name: project.name,
          source: project.source,
          createdAt: project.createdAt,
          fileCount: project.fileCount,
          chunkCount: project.chunkCount,
          summary: project.summary,
          files: project.files
        }))
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/import") {
      const body = JSON.parse((await readBody(req)).toString("utf8") || "{}");
      let importResult;
      if (body.sample) {
        importResult = { files: SAMPLE_FILES, repoName: "Sample Commerce API", source: "sample" };
      } else if (body.repoUrl) {
        importResult = await fetchGithubZip(body.repoUrl);
      } else if (body.zipBase64) {
        const buffer = Buffer.from(body.zipBase64, "base64");
        importResult = {
          files: parseZip(buffer),
          repoName: body.fileName?.replace(/\.zip$/i, "") || "Uploaded Repository",
          source: "zip-upload"
        };
      } else {
        throw new Error("Provide a GitHub repo URL, ZIP upload, or choose the sample repository.");
      }

      const project = createProject({
        name: importResult.repoName,
        source: importResult.source,
        files: importResult.files
      });
      store.projects.push(project);
      await saveStore(store);
      sendJson(res, 200, {
        project: {
          id: project.id,
          name: project.name,
          source: project.source,
          createdAt: project.createdAt,
          fileCount: project.fileCount,
          chunkCount: project.chunkCount,
          summary: project.summary,
          files: project.files
        }
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/chat") {
      const body = JSON.parse((await readBody(req)).toString("utf8") || "{}");
      const project = findProject(store, body.projectId);
      const question = String(body.question || "").trim();
      if (!question) throw new Error("Question is required.");
      const kind = body.kind || inferQuestionType(question);
      const started = Date.now();
      const chunks = retrieveChunks(project, question, kind === "impact" ? 10 : 8);
      const llmPayload = await maybeCallOpenAI({ question, chunks, kind, project });
      const llmUsed = !!llmPayload;
      const payload = llmPayload || (kind === "impact"
        ? generateImpactAnswer(question, chunks, project)
        : generateQaAnswer(question, chunks));
      payload.llm_used = llmUsed;
      // Normalize uncertainty to string for consistent frontend + metrics
      if (payload.uncertainty === true || payload.uncertainty === false) {
        payload.uncertainty = payload.uncertainty ? "High. The available repository context may be insufficient." : "Low to medium.";
      }
      const questionRecord = {
        id: crypto.randomUUID(),
        projectId: project.id,
        question,
        kind,
        createdAt: new Date().toISOString()
      };
      const answerRecord = {
        id: crypto.randomUUID(),
        projectId: project.id,
        questionId: questionRecord.id,
        kind,
        payload,
        responseTimeMs: Date.now() - started,
        createdAt: new Date().toISOString()
      };
      store.questions.push(questionRecord);
      store.answers.push(answerRecord);
      await saveStore(store);
      sendJson(res, 200, { answerId: answerRecord.id, kind, payload });
      return;
    }

    if (req.method === "POST" && pathname === "/api/onboarding") {
      const body = JSON.parse((await readBody(req)).toString("utf8") || "{}");
      const project = findProject(store, body.projectId);
      const payload = generateOnboardingPlan(project, body.role || "Backend Engineer", body.duration || "3 days");
      payload.llm_used = false;
      const questionRecord = {
        id: crypto.randomUUID(),
        projectId: project.id,
        question: `Generate onboarding plan for ${payload.role}, ${payload.duration}`,
        kind: "onboarding",
        createdAt: new Date().toISOString()
      };
      const answerRecord = {
        id: crypto.randomUUID(),
        projectId: project.id,
        questionId: questionRecord.id,
        kind: "onboarding",
        payload,
        responseTimeMs: 0,
        createdAt: new Date().toISOString()
      };
      store.questions.push(questionRecord);
      store.answers.push(answerRecord);
      await saveStore(store);
      sendJson(res, 200, { answerId: answerRecord.id, kind: "onboarding", payload });
      return;
    }

    if (req.method === "POST" && pathname === "/api/agent-impact") {
      const body = JSON.parse((await readBody(req)).toString("utf8") || "{}");
      const project = findProject(store, body.projectId);
      const question = String(body.question || "").trim();
      if (!question) throw new Error("Question is required.");
      const started = Date.now();
      const payload = runAgenticImpactWorkflow(project, question);
      payload.llm_used = false;
      const questionRecord = {
        id: crypto.randomUUID(),
        projectId: project.id,
        question,
        kind: "agent_impact",
        createdAt: new Date().toISOString()
      };
      const answerRecord = {
        id: crypto.randomUUID(),
        projectId: project.id,
        questionId: questionRecord.id,
        kind: "agent_impact",
        payload,
        responseTimeMs: Date.now() - started,
        createdAt: new Date().toISOString()
      };
      store.questions.push(questionRecord);
      store.answers.push(answerRecord);
      await saveStore(store);
      sendJson(res, 200, { answerId: answerRecord.id, kind: "agent_impact", payload });
      return;
    }

    if (req.method === "POST" && pathname === "/api/feedback") {
      const body = JSON.parse((await readBody(req)).toString("utf8") || "{}");
      const answer = store.answers.find((item) => item.id === body.answerId);
      if (!answer) throw new Error("Answer not found.");
      const record = {
        id: crypto.randomUUID(),
        projectId: answer.projectId,
        answerId: answer.id,
        type: body.type,
        createdAt: new Date().toISOString()
      };
      store.feedback.push(record);
      await saveStore(store);
      sendJson(res, 200, { feedback: record, metrics: computeMetrics(store, answer.projectId) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/evaluation") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const project = findProject(store, url.searchParams.get("projectId"));
      sendJson(res, 200, { metrics: computeMetrics(store, project.id) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/health") {
      const hasKey = !!process.env.OPENAI_API_KEY;
      const model = resolveLlmModel();
      const provider = resolveLlmProvider();
      const endpoint = hasKey ? resolveLlmEndpoint() : null;
      sendJson(res, 200, {
        status: "ok",
        llm: {
          configured: hasKey,
          provider,
          model,
          endpoint: endpoint || "(not configured — set OPENAI_API_KEY)"
        },
        version: "0.1.0",
        uptime_seconds: Math.floor(process.uptime())
      });
      return;
    }

    sendJson(res, 404, { error: "API route not found." });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Request failed." });
  }
}

async function serveStatic(req, res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { "content-type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  } catch {
    const fallback = await fs.readFile(path.join(PUBLIC_DIR, "index.html"));
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(fallback);
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    await handleApi(req, res, url.pathname);
    return;
  }
  await serveStatic(req, res, url.pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`AI Developer Onboarding Copilot running at http://${HOST}:${PORT}`);
});
