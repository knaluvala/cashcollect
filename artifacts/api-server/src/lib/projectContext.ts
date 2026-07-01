import { readProjectFile } from "./fileTools";

const DEFAULT_CONTEXT_FILES = [
  "package.json",
  "pnpm-workspace.yaml",
  "artifacts/cashcollect/package.json",
  "artifacts/cashcollect/vite.config.ts",
  "artifacts/cashcollect/src/App.tsx",
  "artifacts/cashcollect/src/context/AuthContext.tsx",
  "artifacts/api-server/package.json",
  "artifacts/api-server/src/app.ts",
  "artifacts/api-server/src/routes/index.ts",
  "artifacts/api-server/src/lib/aiService.ts",
];

export async function getDefaultProjectContext() {
  const context = [];

  for (const filePath of DEFAULT_CONTEXT_FILES) {
    try {
      const content = await readProjectFile(filePath);
      context.push({
        path: filePath,
        content,
      });
    } catch {
      context.push({
        path: filePath,
        content: "File not found or could not be read.",
      });
    }
  }

  return context;
}
