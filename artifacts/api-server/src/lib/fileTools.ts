/*
read project files
write project files
list folders
prevent access outside workspace 
*/

import path from "node:path";
import fs from "node:fs/promises";

const WORKSPACE_ROOT = "/home/runner/workspace";

function resolveSafePath(inputPath: string): string {
  const resolvedPath = path.resolve(WORKSPACE_ROOT, inputPath);

  if (!resolvedPath.startsWith(WORKSPACE_ROOT)) {
    throw new Error("Access outside workspace is not allowed");
  }

  return resolvedPath;
}

export async function readProjectFile(filePath: string): Promise<string> {
  const safePath = resolveSafePath(filePath);
  return fs.readFile(safePath, "utf-8");
}

export async function writeProjectFile(
  filePath: string,
  content: string,
): Promise<void> {
  const safePath = resolveSafePath(filePath);
  await fs.writeFile(safePath, content, "utf-8");
}

export async function listProjectFiles(dir = "."): Promise<string[]> {
  const safeDir = resolveSafePath(dir);
  const results: string[] = [];

  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(WORKSPACE_ROOT, fullPath);

      if (
        relativePath.includes("node_modules") ||
        relativePath.includes(".git") ||
        relativePath.includes("dist")
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        results.push(relativePath);
      }
    }
  }

  await walk(safeDir);
  return results;
}