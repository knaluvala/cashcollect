import { existsSync, rmSync } from "node:fs";

const userAgent = process.env.npm_config_user_agent ?? "";
if (!userAgent.startsWith("pnpm/")) {
  console.error("Use pnpm instead");
  process.exit(1);
}

for (const file of ["package-lock.json", "yarn.lock"]) {
  if (existsSync(file)) {
    rmSync(file, { force: true });
  }
}
