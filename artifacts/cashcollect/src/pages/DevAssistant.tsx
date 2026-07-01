/*
textarea for request
button: Analyze
button: Apply Changes
button: Run Build
output panel
*/

import { useState } from "react";

type FileContext = {
  path: string;
  content: string;
};

const API_HEADERS = {
  "Content-Type": "application/json",
  "x-user-role": "superadmin",
};

export default function DevAssistant() {
  const [message, setMessage] = useState("");
  const [filePath, setFilePath] = useState("");
  const [fileContext, setFileContext] = useState<FileContext[]>([]);
  const [contextFilesUsed, setContextFilesUsed] = useState<string[]>([]);
  const [reply, setReply] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("analyze");

  const addLog = (text: string) => {
    setLog((prev) => [`${new Date().toLocaleTimeString()} - ${text}`, ...prev]);
  };

  const attachFile = async () => {
    if (!filePath.trim()) return;

    const res = await fetch("/api/dev-agent/read-file", {
      method: "POST",
      headers: API_HEADERS,
      body: JSON.stringify({ path: filePath }),
    });

    const text = await res.text();

    if (!text) {
      addLog("API returned empty response");
      return;
    }

    const data = JSON.parse(text);

    if (!data.success) {
      addLog(`Failed to read file: ${data.error}`);
      return;
    }

    setFileContext((prev) => [
      ...prev,
      { path: data.path, content: data.content },
    ]);

    addLog(`Attached file: ${data.path}`);
    setFilePath("");
  };

  const analyze = async () => {
    setLoading(true);
    setReply("");

    try {
      const res = await fetch("/api/dev-agent/chat", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({
          message: `[Mode: ${mode}]\n${message}`,
          fileContext,
        }),
      });

      const text = await res.text();
      console.log("Dev Assistant API response:", text);

      if (!text) {
        addLog(`API returned empty response. HTTP status: ${res.status}`);
        return;
      }

      const data = JSON.parse(text);

      if (!data.success) {
        addLog(`AI error: ${data.error}`);
        return;
      }

      setReply(data.reply);
      setContextFilesUsed(data.contextFilesUsed ?? []);
      addLog("AI analysis completed");
    } finally {
      setLoading(false);
    }
  };

  const runCommand = async (command: string) => {
    setLoading(true);

    try {
      const res = await fetch("/api/dev-agent/run-command", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ command }),
      });

      const text = await res.text();

      if (!text) {
        addLog("API returned empty response");
        return;
      }

      const data = JSON.parse(text);

      if (!data.success) {
        addLog(`Command failed: ${data.error}`);
        return;
      }

      addLog(`Command executed: ${command}`);
      setReply(data.output);
    } finally {
      setLoading(false);
    }
  };

  const applyFileChange = async () => {
    const path = prompt("Enter file path to update:");

    if (!path) return;

    const content = prompt("Paste full updated file content:");

    if (content === null) return;

    const confirmed = confirm(`Are you sure you want to overwrite:\n${path}`);

    if (!confirmed) return;

    const res = await fetch("/api/dev-agent/write-file", {
      method: "POST",
      headers: API_HEADERS,
      body: JSON.stringify({
        path,
        content,
      }),
    });

    const text = await res.text();

    if (!text) {
      addLog("API returned empty response");
      return;
    }

    const data = JSON.parse(text);

    if (!data.success) {
      addLog(`File write failed: ${data.error}`);
      return;
    }

    addLog(`File updated: ${path}`);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1>AI Dev Assistant</h1>

      <section style={{ marginBottom: 24 }}>
        <h2>Development Request</h2>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Mode</label>

          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={{ padding: 8 }}
          >
            <option value="analyze">Analyze Issue</option>
            <option value="plan">Create Plan</option>
            <option value="generate">Generate Code</option>
            <option value="review">Review Code</option>
            <option value="fix">Suggest Fix</option>
            <option value="patch">Generate Patch</option>
          </select>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Example: Fix Settings page so it shows logged-in user details based on role"
          style={{ width: "100%", minHeight: 140, padding: 12 }}
        />

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <input
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="File path e.g. artifacts/cashcollect/src/App.tsx"
            style={{ flex: 1, padding: 8 }}
          />

          <button onClick={attachFile}>Attach File</button>
        </div>

        {fileContext.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <strong>Attached files:</strong>
            <ul>
              {fileContext.map((file) => (
                <li key={file.path}>{file.path}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={analyze}
          disabled={loading || !message.trim()}
          style={{ marginTop: 12 }}
        >
          {loading ? "Working..." : "Analyze"}
        </button>

        <button
          onClick={applyFileChange}
          style={{ marginTop: 12, marginLeft: 8 }}
        >
          Apply File Change
        </button>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Commands</h2>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => runCommand("api-server build")}>
            API Build
          </button>

          <button onClick={() => runCommand("api-server typecheck")}>
            API Typecheck
          </button>

          <button onClick={() => runCommand("cashcollect build")}>
            Web Build
          </button>

          <button onClick={() => runCommand("cashcollect typecheck")}>
            Web Typecheck
          </button>
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>AI / Command Output</h2>

        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "#111",
            color: "#fff",
            padding: 16,
            minHeight: 250,
            overflow: "auto",
          }}
        >
          {reply}
        </pre>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Context Files Used</h2>

        {contextFilesUsed.length === 0 ? (
          <p>No context files used yet.</p>
        ) : (
          <ul>
            {contextFilesUsed.map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Session Log</h2>

        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "#f3f3f3",
            padding: 16,
            minHeight: 150,
          }}
        >
          {log.join("\n")}
        </pre>
      </section>
    </div>
  );
}
