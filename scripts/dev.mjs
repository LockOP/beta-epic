import { spawn } from "node:child_process";

const target = process.argv[2];
const extraArgs = process.argv.slice(3);

const command =
  target === "studio"
    ? ["pnpm", ["--filter", "web", "dev", ...extraArgs]]
    : ["pnpm", ["exec", "turbo", "dev", ...(target ? [target] : []), ...extraArgs]];

const child = spawn(command[0], command[1], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
