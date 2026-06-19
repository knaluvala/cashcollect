/*
pnpm --filter @workspace/api-server build
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/cashcollect build
pnpm --filter @workspace/cashcollect typecheck
*/

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const WORKSPACE_ROOT = "/home/runner/workspace";

const ALLOWED_COMMANDS: Record<string, { command: string; args: string[] }> = {
  "api-server build": {
    command: "pnpm",
    args: ["--filter", "@workspace/api-server", "build"],
  },
  "api-server typecheck": {
    command: "pnpm",
    args: ["--filter", "@workspace/api-server", "typecheck"],
  },
  "cashcollect build": {
    command: "pnpm",
    args: ["--filter", "@workspace/cashcollect", "build"],
  },
  "cashcollect typecheck": {
    command: "pnpm",
    args: ["--filter", "@workspace/cashcollect", "typecheck"],
  },
};

export async function runAllowedCommand(commandKey: string): Promise<string> {
  const selectedCommand = ALLOWED_COMMANDS[commandKey];

  if (!selectedCommand) {
    throw new Error(
      `Command not allowed. Allowed commands: ${Object.keys(ALLOWED_COMMANDS).join(", ")}`,
    );
  }

  try {
    const { stdout, stderr } = await execFileAsync(
      selectedCommand.command,
      selectedCommand.args,
      {
        cwd: WORKSPACE_ROOT,
        timeout: 120_000,
        maxBuffer: 1024 * 1024 * 10,
        env: {
          ...process.env,
        },
      },
    );

    return [stdout, stderr].filter(Boolean).join("\n");
  } catch (error) {
    const err = error as {
      stdout?: string;
      stderr?: string;
      message?: string;
    };

    return [
      err.message ? `Command failed: ${err.message}` : "Command failed",
      err.stdout,
      err.stderr,
    ]
      .filter(Boolean)
      .join("\n");
  }
}

export function getAllowedCommands(): string[] {
  return Object.keys(ALLOWED_COMMANDS);
}
