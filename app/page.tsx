"use client";

import { useRef, useState } from "react";

interface BatchResult {
  fileName: string;
  success: boolean;
  message: string;
  duplicate?: boolean;
  data?: any;
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);

  const [results, setResults] = useState<BatchResult[]>([]);

  const [error, setError] = useState("");

  function chooseFile() {
    inputRef.current?.click();
  }

  function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;

    if (!selected || selected.length === 0) return;

    setFiles(Array.from(selected));
    setResults([]);
    setError("");
  }

  async function upload() {
    if (files.length === 0) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const formData = new FormData();

      for (const f of files) {
        formData.append("files", f);
      }

      const res = await fetch("/api/upload/batch", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Upload failed");
      }

      setResults(json.results ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFiles([]);
    setResults([]);
    setError("");

    if (inputRef.current) inputRef.current.value = "";
  }

  const parsedCount = results.filter((r) => r.success).length;
  const dupCount = results.filter((r) => r.duplicate).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(24px, 5vw, 40px)",
            marginBottom: 10,
          }}
        >
          Electricity Bill Parser
        </h1>

        <p
          style={{
            opacity: 0.7,
            marginBottom: 32,
            fontSize: "clamp(14px, 2.5vw, 16px)",
          }}
        >
          Upload UPPCL PDFs and automatically extract all bill information.
          Supports multiple files.
        </p>

        <div
          style={{
            border: "2px dashed #475569",
            borderRadius: 12,
            padding: "clamp(20px, 5vw, 40px)",
            textAlign: "center",
            background: "#1e293b",
          }}
        >
          <input
            hidden
            multiple
            type="file"
            accept="application/pdf"
            ref={inputRef}
            onChange={onFilesSelected}
          />

          <button
            onClick={chooseFile}
            style={{
              padding: "14px 28px",
              borderRadius: 8,
              border: 0,
              cursor: "pointer",
              fontSize: 16,
              width: "100%",
              maxWidth: 280,
            }}
          >
            Select PDFs
          </button>

          {files.length > 0 && (
            <>
              <div
                style={{
                  marginTop: 25,
                  fontSize: 18,
                }}
              >
                📄 {files.length} file{files.length > 1 ? "s" : ""} selected
              </div>

              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                {files.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 14,
                      opacity: 0.8,
                    }}
                  >
                    {i + 1}. {f.name} ({(f.size / 1024).toFixed(2)} KB)
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 30, flexDirection: "column" }}>
                <button
                  disabled={loading}
                  onClick={upload}
                  style={{
                    padding: "14px 30px",
                    borderRadius: 8,
                    background: "#22c55e",
                    color: "white",
                    border: 0,
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {loading
                    ? `Processing ${results.length}/${files.length}...`
                    : "Upload & Parse All"}
                </button>

                <button
                  onClick={reset}
                  style={{
                    padding: "14px 30px",
                    borderRadius: 8,
                    border: "1px solid #475569",
                    background: "transparent",
                    color: "#94A3B8",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Reset
                </button>
              </div>
            </>
          )}
        </div>

        {error && (
          <div
            style={{
              marginTop: 25,
              background: "#7f1d1d",
              padding: 20,
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div
            style={{
              marginTop: 40,
            }}
          >
            <h2>
              Results{" "}
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  opacity: 0.7,
                }}
              >
                ({parsedCount} parsed
                {dupCount > 0 ? `, ${dupCount} duplicates` : ""}
                {failCount > 0 ? `, ${failCount} failed` : ""})
              </span>
            </h2>

            <div
              style={{
                marginTop: 20,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {results.map((r, i) => (
                <div
                  key={i}
                  style={{
                    background: r.success
                      ? r.duplicate
                        ? "#713f12"
                        : "#064e3b"
                      : "#7f1d1d",
                    padding: 16,
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {r.duplicate ? "🔄" : r.success ? "✅" : "❌"} {r.fileName}
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      opacity: 0.9,
                    }}
                  >
                    {r.message}
                  </div>

                  {r.success && !r.duplicate && r.data && (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        opacity: 0.8,
                      }}
                    >
                      {r.data.accountNumber} &middot; {r.data.billMonth}{" "}
                      &middot; {r.data.consumerName} &middot; ₹
                      {r.data.payableAmount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
