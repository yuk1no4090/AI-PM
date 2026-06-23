import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";

const scriptFiles = (await readdir("scripts"))
  .filter((file) => file.endsWith(".js"))
  .sort()
  .map((file) => `scripts/${file}`);

const checkScripts = scriptFiles.filter((file) => /^scripts\/check-.*\.js$/.test(file));

const syntaxTargets = [
  "server.js",
  "public/app.js",
  ...scriptFiles
];

function runNode(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      stdio: "inherit"
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`node ${args.join(" ")} failed with exit code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

for (const target of syntaxTargets) {
  await runNode(["--check", target]);
}

for (const script of checkScripts) {
  await runNode([script]);
}

console.log(JSON.stringify({
  ok: true,
  syntaxTargets: syntaxTargets.length,
  checkScripts: checkScripts.length
}, null, 2));
