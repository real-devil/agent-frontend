import type { RefObject } from "react";

import type { Message } from "../types";

type ChatPanelProps = {
  input: string;
  loading: boolean;
  messages: Message[];
  sessionId: string;
  workflowStatus?: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onInputChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  statusLabel: (status?: string) => string;
  statusTone: (status?: string) => string;
};

export function ChatPanel({
  input,
  loading,
  messages,
  sessionId,
  workflowStatus,
  messagesEndRef,
  onInputChange,
  onKeyDown,
  onSend,
  statusLabel,
  statusTone,
}: ChatPanelProps) {
  return (
    <main className="flex min-h-[70vh] flex-col rounded-[30px] border border-white/10 bg-slate-950/45 shadow-[0_20px_80px_rgba(15,23,42,0.4)] backdrop-blur">
      <div className="border-b border-white/8 px-6 py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-200/70">Conversation</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Workflow Chat</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
              Session: {sessionId || "Not started"}
            </span>
            <span className={`rounded-full border px-3 py-1 ${statusTone(workflowStatus)}`}>
              {statusLabel(workflowStatus)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/5 p-10 text-center text-slate-400">
            Start a conversation to trigger the multi-agent workflow.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-3xl rounded-3xl px-5 py-4 text-sm leading-7 shadow-lg ${
                    message.role === "user"
                      ? "rounded-br-md bg-sky-500 text-white"
                      : "rounded-bl-md border border-white/10 bg-white/8 text-slate-100"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-3xl rounded-bl-md border border-white/10 bg-white/8 px-5 py-4 text-sm text-slate-300">
                  Working through the workflow...
                </div>
              </div>
            ) : null}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/8 px-6 py-5">
        <div className="mx-auto flex max-w-4xl gap-3">
          <textarea
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a question. Press Enter to send and Shift+Enter for a new line."
            rows={3}
            className="min-h-[96px] flex-1 resize-none rounded-3xl border border-white/10 bg-slate-950/70 px-5 py-4 text-sm text-slate-100 outline-none transition focus:border-sky-400/60"
          />
          <button
            onClick={onSend}
            disabled={loading || !input.trim()}
            className="h-14 rounded-2xl bg-sky-500 px-6 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
