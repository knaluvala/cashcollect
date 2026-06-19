import { Router } from "express";
import { askAI } from "../lib/aiService";

const router = Router();

router.post("/ai/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const reply = await askAI(message);

    return res.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "AI request failed",
    });
  }
});

export default router;