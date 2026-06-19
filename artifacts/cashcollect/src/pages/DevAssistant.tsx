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
  const [reply, setReply] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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

    const data = await res.json();

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
          message,
          fileContext,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        addLog(`AI error: ${data.error}`);
        return;
      }

      setReply(data.reply);
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

      const data = await res.json();

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

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1>AI Dev Assistant</h1>

      <section style={{ marginBottom: 24 }}>
        <h2>Development Request</h2>

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
