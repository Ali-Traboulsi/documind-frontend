"use client";
import { DragEvent, useRef, useState } from "react";

type UploadState = "idle" | "dragging" | "uploading" | "done" | "error";

export default function UploadPanel({
  onUploaded,
}: {
  onUploaded: (docId: string, name: string, guide: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── drag handlers ── */
  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setState("dragging");
  };
  const onDragLeave = () => setState(file ? "idle" : "idle");
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      setState("idle");
      setErrorMsg("");
    } else {
      setErrorMsg("Only PDF files are supported.");
      setState("idle");
    }
  };

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      setErrorMsg("Only PDF files are supported.");
      return;
    }
    setFile(f);
    setErrorMsg("");
  };

  /* ── upload ── */
  const handleUpload = async () => {
    if (!file || state === "uploading") return;
    setState("uploading");
    setProgress(0);
    setErrorMsg("");

    // Fake progress tick while waiting for server
    const tick = setInterval(
      () => setProgress((p) => Math.min(p + 6, 88)),
      300,
    );

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const data = await res.json();

      clearInterval(tick);
      setProgress(100);

      if (data.status === "success") {
        setState("done");
        onUploaded(
          data.upload_details.file_resource_name,
          file.name,
          data.source_guide ?? "",
        );
      } else {
        throw new Error("Unexpected response from server.");
      }
    } catch (err: unknown) {
      clearInterval(tick);
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed.");
    }
  };

  const reset = () => {
    setFile(null);
    setState("idle");
    setProgress(0);
    setErrorMsg("");
  };

  const isDragging = state === "dragging";
  const isUploading = state === "uploading";
  const isDone = state === "done";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isDone && inputRef.current?.click()}
        className={isDragging ? "drop-active" : ""}
        style={{
          border: `2px dashed ${isDragging ? "var(--accent)" : isDone ? "var(--success)" : "var(--border)"}`,
          borderRadius: 12,
          padding: "20px 16px",
          textAlign: "center",
          cursor: isDone ? "default" : "pointer",
          background: isDragging
            ? "var(--accent-dim)"
            : isDone
              ? "rgba(16,185,129,0.07)"
              : "var(--bg-card)",
          transition: "all 0.2s ease",
          userSelect: "none",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />

        {isDone ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div style={{ fontSize: 24 }}>✅</div>
            <div
              style={{ fontSize: 13, fontWeight: 600, color: "var(--success)" }}
            >
              Uploaded successfully
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              {file?.name}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              style={{
                marginTop: 4,
                padding: "4px 12px",
                fontSize: 11,
                border: "1px solid var(--border)",
                borderRadius: 6,
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              Upload another
            </button>
          </div>
        ) : file ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div style={{ fontSize: 24 }}>📄</div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              {file.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div style={{ fontSize: 28, opacity: 0.6 }}>☁️</div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-primary)",
              }}
            >
              {isDragging
                ? "Drop your PDF here"
                : "Drop PDF or click to browse"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              PDF files only
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isUploading && (
        <div
          style={{
            borderRadius: 99,
            height: 4,
            background: "var(--bg-card)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, var(--accent), #7c3aed)",
              borderRadius: 99,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div
          style={{
            fontSize: 12,
            color: "var(--danger)",
            padding: "8px 12px",
            background: "rgba(239,68,68,0.08)",
            borderRadius: 8,
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Upload button */}
      {!isDone && (
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          style={{
            padding: "10px",
            borderRadius: 10,
            border: "none",
            background:
              !file || isUploading
                ? "var(--bg-card)"
                : "linear-gradient(135deg, var(--accent), #7c3aed)",
            color: !file || isUploading ? "var(--text-muted)" : "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: !file || isUploading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {isUploading ? (
            <>
              <span
                className="shimmer"
                style={{
                  display: "inline-block",
                  width: 80,
                  height: 13,
                  borderRadius: 4,
                }}
              />
            </>
          ) : (
            "Analyse Document"
          )}
        </button>
      )}
    </div>
  );
}
