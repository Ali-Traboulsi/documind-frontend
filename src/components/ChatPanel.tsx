"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatResponse, Citation } from "../lib/types";

type Message = {
  role: "user" | "assistant";
  text: string;
  citations: Citation[];
  timestamp: Date;
};

const SUGGESTIONS = [
  "Summarise this document",
  "What are the key findings?",
  "List the main topics covered",
  "What conclusions does it draw?",
];

/* ─── Simple inline Markdown renderer ──────────────────────────────────── */
function MarkdownText({
  text,
  onCitationClick,
}: {
  text: string;
  onCitationClick?: (index: number) => void;
}) {
  const lines = text.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {lines.map((line, i) => {
        // h2
        if (line.startsWith("## ")) {
          return (
            <div
              key={i}
              style={{
                fontWeight: 700,
                fontSize: 13.5,
                color: "var(--text-primary)",
                marginTop: i > 0 ? 10 : 0,
                marginBottom: 2,
              }}
            >
              {renderInline(line.slice(3), onCitationClick)}
            </div>
          );
        }
        // h3
        if (line.startsWith("### ")) {
          return (
            <div
              key={i}
              style={{
                fontWeight: 600,
                fontSize: 13,
                color: "var(--text-primary)",
                marginTop: i > 0 ? 8 : 0,
              }}
            >
              {renderInline(line.slice(4), onCitationClick)}
            </div>
          );
        }
        // bullet
        if (/^[-*]\s/.test(line)) {
          return (
            <div key={i} style={{ display: "flex", gap: 8, paddingLeft: 4 }}>
              <span
                style={{ color: "var(--accent)", marginTop: 2, flexShrink: 0 }}
              >
                •
              </span>
              <span style={{ color: "var(--bot-text)", lineHeight: 1.65 }}>
                {renderInline(line.slice(2), onCitationClick)}
              </span>
            </div>
          );
        }
        // numbered list
        const numbered = line.match(/^(\d+)\.\s(.*)/);
        if (numbered) {
          return (
            <div key={i} style={{ display: "flex", gap: 8, paddingLeft: 4 }}>
              <span
                style={{
                  color: "var(--accent)",
                  flexShrink: 0,
                  fontWeight: 600,
                  minWidth: 20,
                  textAlign: "right",
                }}
              >
                {numbered[1]}.
              </span>
              <span style={{ color: "var(--bot-text)", lineHeight: 1.65 }}>
                {renderInline(numbered[2], onCitationClick)}
              </span>
            </div>
          );
        }
        // empty line → spacer
        if (!line.trim()) return <div key={i} style={{ height: 4 }} />;
        // normal paragraph
        return (
          <div key={i} style={{ color: "var(--bot-text)", lineHeight: 1.7 }}>
            {renderInline(line, onCitationClick)}
          </div>
        );
      })}
    </div>
  );
}

function renderInline(
  text: string,
  onCitationClick?: (index: number) => void,
): React.ReactNode {
  // Bold: **x** and citation markers [1] [2][3]
  const parts = text.split(/(\*\*.*?\*\*|\[[\d,\s]+\])/g);
  return parts.map((p, i) => {
    if (/^\*\*.*\*\*$/.test(p)) {
      return (
        <strong
          key={i}
          style={{ fontWeight: 700, color: "var(--text-primary)" }}
        >
          {p.slice(2, -2)}
        </strong>
      );
    }
    if (/^\[[\d,\s]+\]$/.test(p)) {
      // Extract the number from [N]
      const num = parseInt(p.replace(/[^\d]/g, ""), 10);
      return (
        <sup key={i}>
          <button
            onClick={() => onCitationClick?.(num)}
            title={`Go to source ${num}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--accent-dim)",
              color: "var(--accent)",
              fontSize: 10,
              fontWeight: 700,
              padding: "1px 5px",
              borderRadius: 4,
              marginLeft: 1,
              border: "none",
              cursor: onCitationClick ? "pointer" : "default",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (onCitationClick)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(79,142,247,0.28)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--accent-dim)";
            }}
          >
            {p}
          </button>
        </sup>
      );
    }
    return p;
  });
}

/* ─── Copy button ───────────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      title="Copy response"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "2px 6px",
        borderRadius: 6,
        fontSize: 12,
        color: copied ? "var(--success)" : "var(--text-muted)",
        transition: "color 0.2s",
      }}
    >
      {copied ? "✓ Copied" : "⎘ Copy"}
    </button>
  );
}

/* ─── Citation card ────────────────────────────────────────────────────── */
function CitationCard({ cit, cardId }: { cit: Citation; cardId: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      id={cardId}
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 12px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        fontSize: 12,
        cursor: cit.snippet ? "pointer" : "default",
        transition: "border-color 0.3s, background 0.3s",
        scrollMarginTop: 8,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "var(--border-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--border)")
      }
      onClick={() => cit.snippet && setExpanded(!expanded)}
    >
      {/* Badge */}
      <span
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--accent-dim)",
          color: "var(--accent)",
          borderRadius: "50%",
          fontWeight: 700,
          fontSize: 10,
        }}
      >
        {cit.index}
      </span>

      <div style={{ flex: 1, overflow: "hidden" }}>
        <div
          style={{
            fontWeight: 600,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {cit.title || `Source ${cit.index}`}
        </div>
        {cit.snippet && (
          <div
            style={
              {
                color: "var(--text-secondary)",
                marginTop: 3,
                lineHeight: 1.6,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: expanded ? 99 : 2,
                WebkitBoxOrient: "vertical",
              } as React.CSSProperties
            }
          >
            {cit.snippet}
          </div>
        )}
        {cit.uri && (
          <a
            href={cit.uri}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              color: "var(--accent)",
              fontSize: 11,
              marginTop: 2,
              display: "inline-block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
          >
            🔗 {cit.uri}
          </a>
        )}
      </div>

      {cit.snippet && (
        <span
          style={{
            color: "var(--text-muted)",
            fontSize: 10,
            flexShrink: 0,
            alignSelf: "flex-start",
            marginTop: 2,
          }}
        >
          {expanded ? "▲" : "▼"}
        </span>
      )}
    </div>
  );
}

/* ─── Message bubble ───────────────────────────────────────────────────── */
function MessageBubble({ msg, msgIndex }: { msg: Message; msgIndex: number }) {
  const isUser = msg.role === "user";
  const timeStr = msg.timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleCitationClick = (citIndex: number) => {
    const id = `citation-${msgIndex}-${citIndex}`;
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    // Trigger the flash highlight by temporarily setting a class
    el.style.background = "rgba(79,142,247,0.18)";
    el.style.borderColor = "var(--accent)";
    setTimeout(() => {
      el.style.background = "";
      el.style.borderColor = "";
    }, 1200);
  };

  return (
    <div
      className="msg-enter"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: 6,
      }}
    >
      {/* Role label + time */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          paddingLeft: isUser ? 0 : 2,
          paddingRight: isUser ? 2 : 0,
        }}
      >
        {!isUser && (
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#4f8ef7,#7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
            }}
          >
            🧠
          </div>
        )}
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {isUser ? "You" : "DocuMind"} · {timeStr}
        </span>
        {isUser && (
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
            }}
          >
            👤
          </div>
        )}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: "82%",
          padding: "12px 16px",
          borderRadius: 16,
          borderBottomRightRadius: isUser ? 4 : 16,
          borderBottomLeftRadius: isUser ? 16 : 4,
          background: isUser ? "var(--user-bubble)" : "var(--bot-bubble)",
          border: isUser ? "none" : "1px solid var(--border)",
          color: isUser ? "var(--user-text)" : "var(--bot-text)",
          fontSize: 13.5,
          lineHeight: 1.65,
        }}
      >
        {isUser ? (
          <span style={{ whiteSpace: "pre-wrap" }}>{msg.text}</span>
        ) : (
          <MarkdownText text={msg.text} onCitationClick={handleCitationClick} />
        )}
      </div>

      {/* Actions + citations (assistant only) */}
      {!isUser && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxWidth: "82%",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              paddingLeft: 2,
            }}
          >
            <CopyButton text={msg.text} />
          </div>

          {msg.citations.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  paddingLeft: 2,
                }}
              >
                Sources ({msg.citations.length})
              </div>
              {msg.citations.map((c) => (
                <CitationCard
                  key={c.index}
                  cit={c}
                  cardId={`citation-${msgIndex}-${c.index}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────── */
export default function ChatPanel({ ragFileId }: { ragFileId: string }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || loading) return;

      setMessages((prev) => [
        ...prev,
        { role: "user", text: msg, citations: [], timestamp: new Date() },
      ]);
      setInput("");
      setLoading(true);
      inputRef.current?.blur();

      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg, session_id: sessionId }),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data: ChatResponse = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.response,
            citations: data.citations ?? [],
            timestamp: new Date(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "⚠️ Something went wrong. Please check the server and try again.",
            citations: [],
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, sessionId],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Message list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {isEmpty && !loading ? (
          /* ── Suggestion chips when chat is empty ── */
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              padding: "20px 0",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 6,
                }}
              >
                What would you like to know?
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Try one of these or type your own question
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                justifyContent: "center",
                maxWidth: 520,
              }}
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 20,
                    border: "1px solid var(--border)",
                    background: "var(--bg-card)",
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--accent)";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--border)";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--text-secondary)";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} msgIndex={i} />
            ))}

            {/* typing indicator */}
            {loading && (
              <div
                className="msg-enter"
                style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#4f8ef7,#7c3aed)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                >
                  🧠
                </div>
                <div
                  style={{
                    padding: "14px 18px",
                    background: "var(--bot-bubble)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    borderBottomLeftRadius: 4,
                    display: "flex",
                    gap: 5,
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="typing-dot"
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "var(--accent)",
                        display: "inline-block",
                        animationDelay: `${d * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-sidebar)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "8px 8px 8px 16px",
            transition: "border-color 0.2s",
          }}
          onFocusCapture={(e) =>
            (e.currentTarget.style.borderColor = "var(--accent)")
          }
          onBlurCapture={(e) =>
            (e.currentTarget.style.borderColor = "var(--border)")
          }
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask a question about your document…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: 14,
              caretColor: "var(--accent)",
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              border: "none",
              background:
                !input.trim() || loading
                  ? "var(--bg-card)"
                  : "linear-gradient(135deg, var(--accent), #7c3aed)",
              color: !input.trim() || loading ? "var(--text-muted)" : "#fff",
              cursor: !input.trim() || loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
              transition: "all 0.2s",
            }}
            title="Send (Enter)"
          >
            ➤
          </button>
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "var(--text-muted)",
            marginTop: 8,
          }}
        >
          DocuMind may make mistakes — always verify critical information.
        </div>
      </div>
    </div>
  );
}
