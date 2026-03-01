"use client";

import { useState } from "react";
import ChatPanel from "../components/ChatPanel";
import UploadPanel from "../components/UploadPanel";

export default function HomePage() {
  const [ragFileId, setRagFileId] = useState<string | null>(null);
  const [sourceGuide, setSourceGuide] = useState<string>("");
  const [docName, setDocName] = useState<string>("");

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* ── Left sidebar ── */}
      <aside
        style={{
          width: "340px",
          minWidth: "320px",
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Logo / Brand */}
        <div
          style={{
            padding: "24px 20px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #4f8ef7, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              🧠
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: "var(--text-primary)",
                }}
              >
                DocuMind
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  marginTop: 1,
                }}
              >
                AI Document Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* Upload section */}
        <div
          style={{ padding: "20px", borderBottom: "1px solid var(--border)" }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            Source Document
          </div>
          <UploadPanel
            onUploaded={(id, name, guide) => {
              setRagFileId(id);
              setDocName(name);
              setSourceGuide(guide);
            }}
          />
        </div>

        {/* Source Guide */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
          {sourceGuide ? (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 12,
                }}
              >
                AI Source Briefing
              </div>
              <SourceGuideCard text={sourceGuide} filename={docName} />
            </div>
          ) : (
            <EmptySourceState />
          )}
        </div>
      </aside>

      {/* ── Main chat area ── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-page)",
          overflow: "hidden",
        }}
      >
        {/* Top bar */}
        <header
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--bg-sidebar)",
            flexShrink: 0,
          }}
        >
          {ragFileId ? (
            <>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--success)",
                  boxShadow: "0 0 6px var(--success)",
                }}
              />
              <span
                style={{
                  fontSize: 14,
                  color: "var(--text-primary)",
                  fontWeight: 500,
                }}
              >
                {docName || "Document loaded"}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  marginLeft: "auto",
                }}
              >
                Ready to answer questions
              </span>
            </>
          ) : (
            <>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--text-muted)",
                }}
              />
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                Upload a document to begin
              </span>
            </>
          )}
        </header>

        {/* Chat */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {ragFileId ? <ChatPanel ragFileId={ragFileId} /> : <WelcomeScreen />}
        </div>
      </main>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────── */

function EmptySourceState() {
  return (
    <div style={{ textAlign: "center", paddingTop: 24 }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        Upload a PDF to get an AI-generated briefing, summary, and suggested
        questions.
      </div>
    </div>
  );
}

function WelcomeScreen() {
  const tips = [
    'Try: "Summarise this document"',
    'Try: "What are the key findings?"',
    'Try: "Compare section 2 and section 4"',
    'Try: "List all mentioned dates and events"',
  ];
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: "40px 60px",
      }}
    >
      <div style={{ fontSize: 48 }}>💬</div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Your AI Research Assistant
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            maxWidth: 420,
          }}
        >
          Upload a PDF on the left to unlock intelligent Q&amp;A,
          source-grounded answers, and structured insights — inspired by
          NotebookLM.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
          maxWidth: 480,
        }}
      >
        {tips.map((t) => (
          <div
            key={t}
            style={{
              padding: "8px 14px",
              border: "1px solid var(--border)",
              borderRadius: 20,
              fontSize: 12,
              color: "var(--text-secondary)",
              background: "var(--bg-card)",
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceGuideCard({
  text,
  filename,
}: {
  text: string;
  filename: string;
}) {
  // Split the AI briefing into sections by numbered headings (1. 2. etc)
  const sections = text.split(/\n(?=\d\.|\*\*\d)/).filter(Boolean);

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* File badge */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(79,142,247,0.07)",
        }}
      >
        <span style={{ fontSize: 14 }}>📎</span>
        <span
          style={{
            fontSize: 12,
            color: "var(--accent)",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {filename}
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          padding: "14px",
          fontSize: 12.5,
          color: "var(--text-secondary)",
          lineHeight: 1.75,
          whiteSpace: "pre-wrap",
          maxHeight: 380,
          overflowY: "auto",
        }}
      >
        {text}
      </div>
    </div>
  );
}
