import axios from "axios";

type FileContext = {
  path: string;
  content: string;
};

export async function askAI(
  message: string,
  fileContext: FileContext[] = [],
): Promise<string> {
  const contextText = fileContext
    .map(
      (file) =>
        `\n\n--- FILE: ${file.path} ---\n${file.content}\n--- END FILE ---`,
    )
    .join("");

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are an internal AI Dev Assistant for a TypeScript pnpm monorepo.

Project structure:
- Frontend: artifacts/cashcollect
- Backend: artifacts/api-server
- Shared packages: lib/*

Your job:
- Analyze bugs
- Read file context provided by the user
- Suggest exact file changes
- Provide clear implementation steps
- Avoid unsafe commands
- Never suggest modifying files outside /home/runner/workspace

When answering:
1. Explain the root cause.
2. Mention files to modify.
3. Provide exact code changes.
4. Mention test/build commands.
5. Warn before destructive changes.

Mode behavior:

If user message starts with [Mode: analyze]:
- Identify root cause only.
- Do not provide full code unless required.
- List affected files.

If user message starts with [Mode: plan]:
- Provide step-by-step implementation plan.
- Do not write code yet.

If user message starts with [Mode: generate]:
- Provide exact code changes.
- Include file paths.
- Prefer full replacement snippets only when necessary.

If user message starts with [Mode: review]:
- Review code for bugs, risks, security, typing issues, and maintainability.
- Do not modify code.

If user message starts with [Mode: fix]:
- Suggest the smallest safe fix.
- Provide before/after snippets.
- Include build/test commands.

If user message starts with [Mode: patch]:
- Return a structured patch only.
- Do not give long explanations.
- Use this exact format:

FILE_PATH:
<file path>

BEFORE:
<existing code snippet>

AFTER:
<replacement code snippet>

REASON:
<short reason>
          `,
        },
        {
          role: "user",
          content: `${message}${contextText}`,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data.choices[0].message.content;
}
