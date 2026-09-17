import path from "node:path";
import { config } from "dotenv";
import { WORKSPACE_ROOT } from "./lib/workspaceRoot";

config({ path: path.join(WORKSPACE_ROOT, "artifacts", "api-server", ".env") });
