import path from "node:path";
import fs from "node:fs";

function findWorkspaceRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error(
    "Could not find workspace root (no pnpm-workspace.yaml found)",
  );
}

export const WORKSPACE_ROOT = findWorkspaceRoot(__dirname);
