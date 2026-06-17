import type { RefObject } from "react";

import type { Message, TraceEvent } from "../types";
import { formatValue } from "./workflow-utils";

type ChatPanelProps = {
  input: string;
  loading: boolean;
  messages: Message[];
  sessionId: string;
  workflowStatus?: string;
  workflowTrace?: TraceEvent[];
  pendingApprovalGroup?: string;
  reviewReason?: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onInputChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  statusLabel: (status?: string) => string;
  statusTone: (status?: string) => string;
};

function WorkflowProgressCard({
  workflowStatus,
  workflowTrace,
  pendingApprovalGroup,
  reviewReason,
}: {
  workflowStatus?: string;
  workflowTrace?: TraceEvent[];
  pendingApprovalGroup?: string;
  reviewReason?: string;
}) {
  const latestTrace = workflowTrace?.at(-1);
  const recentTrace = workflowTrace?.slice(-3) || [];

  return (
    <div className="max-w-3xl rounded-3xl rounded-bl-md border border-sky-300/20 bg-slate-950/75 px-5 py-4 text-sm text-slate-200">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-sky-200/60">Workflow Progress</p>
          <p className="mt-2 text-sm font-medium text-slate-100">
            {workflowStatus === "awaiting_approval"
              ? `Waiting for approval for group ${pendingApprovalGroup || "?"}`
              : `${workflowStatus || "in_progress"}`}
          </p>
        </div>
        {latestTrace ? (
          <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-sky-100">
            {latestTrace.node}
          </span>
        ) : null}
      </div>

      {reviewReason ? <p className="mt-3 text-sm text-slate-300">{reviewReason}</p> : null}

      {recentTrace.length > 0 ? (
        <div className="mt-4 space-y-3">
          {recentTrace.map((trace, index) => {
            const isLatest = index === recentTrace.length - 1;
            return (
              <div
                key={`${trace.node}-${trace.event_type}-${index}`}
                className={`rounded-2xl border p-3 text-xs transition ${
                  isLatest
                    ? "border-sky-300/30 bg-sky-400/10 text-sky-50"
                    : "border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium uppercase tracking-[0.18em]">{trace.event_type}</span>
                  <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    {isLatest ? <span className="rounded-full bg-sky-300/20 px-2 py-1 text-sky-100">Latest</span> : null}
                    <span>{trace.node}</span>
                  </span>
                </div>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-950/70 p-3 text-xs text-slate-400">
                  {formatValue(trace.detail)}
                </pre>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-400">Preparing the workflow trace...</p>
      )}
    </div>
  );
}

export function ChatPanel({
  input,
  loading,
  messages,
  sessionId,
  workflowStatus,
  workflowTrace,
  pendingApprovalGroup,
  reviewReason,
  messagesEndRef,
  onInputChange,
  onKeyDown,
  onSend,
  statusLabel,
  statusTone,
}: ChatPanelProps) {
  return (
    <main className="flex min-h-[70vh] flex-col rounded-[28px] border border-white/10 bg-slate-950/45 shadow-[0_20px_80px_rgba(15,23,42,0.4)] backdrop-blur">
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
                  className={`max-w-3xl rounded-3xl px-5 py-4 text-sm leading-7 ${
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
                <WorkflowProgressCard
                  workflowStatus={workflowStatus}
                  workflowTrace={workflowTrace}
                  pendingApprovalGroup={pendingApprovalGroup}
                  reviewReason={reviewReason}
                />
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
            className="min-h-[96px] flex-1 resize-none rounded-3xl border border-white/10 bg-slate-950/70 px-5 py-4 text-sm text-slate-100 outline-none transition focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/20"
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
