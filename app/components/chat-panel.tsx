import type { RefObject } from "react";

import type { ConversationTurn, TraceEvent } from "../types";

type ChatPanelProps = {
  chatError: string;
  input: string;
  loading: boolean;
  turns: ConversationTurn[];
  selectedTurnId: string;
  sessionId: string;
  workflowStatus?: string;
  workflowTrace?: TraceEvent[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onInputChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onSelectTurn: (turnId: string) => void;
  statusLabel: (status?: string) => string;
  statusTone: (status?: string) => string;
};

function AssistantReplySkeleton() {
  return (
    <div className="max-w-3xl animate-pulse space-y-2.5 rounded-3xl rounded-bl-md border border-white/10 bg-white/8 px-5 py-4">
      <div className="h-3 w-3/4 rounded bg-white/10" />
      <div className="h-3 w-full rounded bg-white/10" />
      <div className="h-3 w-5/6 rounded bg-white/10" />
    </div>
  );
}

function TurnMessages({
  turn,
  loading,
  latestTrace,
}: {
  turn: ConversationTurn;
  loading: boolean;
  latestTrace?: TraceEvent;
}) {
  const isEmptyReply = !turn.reply?.trim();

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="max-w-3xl rounded-3xl rounded-br-md bg-sky-500 px-5 py-4 text-sm leading-7 text-white">
          {turn.user_message}
        </div>
      </div>

      <div className="flex justify-start">
        {isEmptyReply && loading ? (
          <div className="max-w-3xl space-y-2">
            <AssistantReplySkeleton />
            {latestTrace ? (
              <p className="px-1 text-xs text-slate-500">
                {latestTrace.node} · {latestTrace.event_type}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="max-w-3xl rounded-3xl rounded-bl-md border border-white/10 bg-white/8 px-5 py-4 text-sm leading-7 text-slate-100">
            {isEmptyReply ? (
              <span className="text-slate-400">Awaiting workflow output.</span>
            ) : (
              turn.reply
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TurnGroup({
  turn,
  index,
  selected,
  loading,
  latestTrace,
  onSelectTurn,
  statusLabel,
  statusTone,
}: {
  turn: ConversationTurn;
  index: number;
  selected: boolean;
  loading: boolean;
  latestTrace?: TraceEvent;
  onSelectTurn: (turnId: string) => void;
  statusLabel: (status?: string) => string;
  statusTone: (status?: string) => string;
}) {
  const showStatus = selected || turn.status !== "completed";

  return (
    <div
      className={`rounded-2xl transition ${
        selected ? "bg-sky-400/5 ring-1 ring-sky-300/20" : "hover:bg-white/3"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelectTurn(turn.turn_id)}
        className="flex w-full items-center justify-between gap-3 px-2 py-2 text-left"
        aria-pressed={selected}
      >
        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Turn {index + 1}</span>
        {showStatus ? (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusTone(turn.status)}`}>
            {statusLabel(turn.status)}
          </span>
        ) : null}
      </button>

      <div className="px-2 pb-3">
        <TurnMessages turn={turn} loading={loading} latestTrace={loading ? latestTrace : undefined} />
      </div>
    </div>
  );
}

export function ChatPanel({
  chatError,
  input,
  loading,
  turns,
  selectedTurnId,
  sessionId,
  workflowStatus,
  workflowTrace,
  messagesEndRef,
  onInputChange,
  onKeyDown,
  onSend,
  onSelectTurn,
  statusLabel,
  statusTone,
}: ChatPanelProps) {
  return (
    <main className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-white/10 bg-slate-950/45 shadow-[0_20px_80px_rgba(15,23,42,0.4)] backdrop-blur">
      <div className="shrink-0 border-b border-white/8 px-6 py-5">
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

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {turns.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/5 p-10 text-center text-slate-400">
            Start a conversation to trigger the multi-agent workflow.
          </div>
        ) : (
          <div className="space-y-6">
            {turns.map((turn, index) => (
              <TurnGroup
                key={turn.turn_id}
                turn={turn}
                index={index}
                selected={turn.turn_id === selectedTurnId}
                loading={loading && index === turns.length - 1}
                latestTrace={workflowTrace?.at(-1)}
                onSelectTurn={onSelectTurn}
                statusLabel={statusLabel}
                statusTone={statusTone}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 border-t border-white/8 px-6 py-5">
        {chatError ? (
          <div className="mb-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {chatError}
          </div>
        ) : null}
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
