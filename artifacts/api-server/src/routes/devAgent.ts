/*
POST /api/dev-agent/chat
POST /api/dev-agent/read-file
POST /api/dev-agent/write-file
POST /api/dev-agent/run-command
*/

import { Router } from "express";
import {
  listProjectFiles,
  readProjectFile,
  writeProjectFile,
} from "../lib/fileTools";
import { getAllowedCommands, runAllowedCommand } from "../lib/commandRunner";
import { askAI } from "../lib/aiService";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  const userRole = req.headers["x-user-role"];

  if (userRole !== "superadmin") {
    return res.status(403).json({
      success: false,
      error: "Access denied. Superadmin role is required.",
    });
  }

  next();
}

router.use("/dev-agent", requireAdmin);

router.get("/dev-agent/files", async (req, res) => {
  try {
    const dir = typeof req.query.dir === "string" ? req.query.dir : ".";
    const files = await listProjectFiles(dir);

    return res.json({
      success: true,
      files,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to list files",
    });
  }
});

router.post("/dev-agent/read-file", async (req, res) => {
  try {
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({
        success: false,
        error: "path is required",
      });
    }

    const content = await readProjectFile(path);

    return res.json({
      success: true,
      path,
      content,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to read file",
    });
  }
});

router.post("/dev-agent/write-file", async (req, res) => {
  try {
    const { path, content } = req.body;

    if (!path || typeof content !== "string") {
      return res.status(400).json({
        success: false,
        error: "path and content are required",
      });
    }

    await writeProjectFile(path, content);

    return res.json({
      success: true,
      message: "File written successfully",
      path,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to write file",
    });
  }
});

router.get("/dev-agent/commands", (_req, res) => {
  return res.json({
    success: true,
    commands: getAllowedCommands(),
  });
});

router.post("/dev-agent/run-command", async (req, res) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({
        success: false,
        error: "command is required",
      });
    }

    const output = await runAllowedCommand(command);

    return res.json({
      success: true,
      command,
      output,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to run command",
    });
  }
});

router.post("/dev-agent/chat", async (req, res) => {
  try {
    const { message, fileContext } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "message is required",
      });
    }

    const contextText = Array.isArray(fileContext)
      ? fileContext
          .map(
            (file) =>
              `\n\n--- FILE: ${file.path} ---\n${file.content}\n--- END FILE ---`,
          )
          .join("")
      : "";

    const reply = await askAI(`${message}${contextText}`);

    return res.json({
      success: true,
      reply,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "AI request failed",
    });
  }
});

export default router;
