import { listProjectFiles, readProjectFile } from "./fileTools";

const MAX_FILES = 8;
const MAX_FILE_CHARS = 20_000;

const IMPORTANT_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".yaml",
  ".yml",
];

const KEYWORD_TO_PATH_HINTS: Record<string, string[]> = {
  settings: ["settings", "SettingsContent"],
  login: ["AuthContext", "sign-up-login", "LoginForm"],
  auth: ["AuthContext", "LoginForm"],
  user: ["users", "user-management", "AuthContext"],
  route: ["routes", "route-master"],
  parlor: ["parlor", "parlor-master"],
  collection: ["collection", "daily-collection"],
  report: ["reports", "SummaryReport", "DetailedReport"],
  sidebar: ["Sidebar"],
  navigation: ["Sidebar", "App.tsx"],
  api: ["api-server", "routes/index.ts", "app.ts"],
};

function normalize(value: string) {
  return value.toLowerCase();
}

function scoreFile(filePath: string, prompt: string) {
  const lowerPath = normalize(filePath);
  const lowerPrompt = normalize(prompt);

  let score = 0;

  for (const ext of IMPORTANT_EXTENSIONS) {
    if (lowerPath.endsWith(ext)) score += 2;
  }

  for (const [keyword, hints] of Object.entries(KEYWORD_TO_PATH_HINTS)) {
    if (lowerPrompt.includes(keyword)) {
      for (const hint of hints) {
        if (lowerPath.includes(normalize(hint))) score += 10;
      }
    }
  }

  const promptWords = lowerPrompt
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4);

  for (const word of promptWords) {
    if (lowerPath.includes(word)) score += 3;
  }

  if (lowerPath.includes("node_modules")) score -= 100;
  if (lowerPath.includes("dist/")) score -= 100;
  if (lowerPath.includes(".git")) score -= 100;

  return score;
}

export async function discoverRelevantFiles(prompt: string) {
  const allFiles = await listProjectFiles(".");

  const rankedFiles = allFiles
    .map((filePath) => ({
      path: filePath,
      score: scoreFile(filePath, prompt),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_FILES);

  const context = [];

  for (const file of rankedFiles) {
    try {
      const content = await readProjectFile(file.path);
      context.push({
        path: file.path,
        content:
          content.length > MAX_FILE_CHARS
            ? content.slice(0, MAX_FILE_CHARS) + "\n\n// File truncated"
            : content,
      });
    } catch {
      // Ignore unreadable files
    }
  }

  return context;
}