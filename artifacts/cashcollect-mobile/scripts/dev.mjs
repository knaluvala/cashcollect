import { spawn } from "node:child_process";

const env = {
  ...process.env,
  PORT: process.env.PORT ?? "8082",
};

const isWindows = process.platform === "win32";
const child = spawn(
  isWindows ? "pnpm.cmd" : "pnpm",
  ["exec", "expo", "start", "--localhost", "--port", env.PORT],
  { env, stdio: "inherit", shell: isWindows }
);

child.on("exit", (code) => process.exit(code ?? 0));
