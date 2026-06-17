"use client";

import { useMemo } from "react";

import { ChatPanel } from "./components/chat-panel";
import { DocumentSidebar } from "./components/document-sidebar";
import { statusLabel, statusTone } from "./components/workflow-utils";
import { WorkflowSidebar } from "./components/workflow-sidebar";
import { useAgentWorkflow } from "./hooks/use-agent-workflow";

export default function Home() {
  const {
    chatError,
    documents,
    fileInputRef,
    input,
    loading,
    messagesEndRef,
    selectedDocId,
    selectedTurnId,
    sessionId,
    turns,
    uploadError,
    uploading,
    workflowState,
    setInput,
    setSelectedDocId,
    setSelectedTurnId,
    handleApproval,
    handleKeyDown,
    handleSend,
    handleUpload,
    resetSession,
  } = useAgentWorkflow();

  const activeTurnId = workflowState?.current_turn_id || turns.at(-1)?.turn_id;
  const activeTurnTrace = useMemo(() => {
    const activeTurn = turns.find((turn) => turn.turn_id === activeTurnId);
    return activeTurn?.workflow_trace ?? workflowState?.workflow_trace;
  }, [activeTurnId, turns, workflowState?.workflow_trace]);

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.12),_transparent_30%),linear-gradient(180deg,_#050816_0%,_#0f172a_45%,_#020617_100%)] text-slate-100">
      <div className="mx-auto grid h-full max-w-[1700px] gap-4 overflow-hidden p-4 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        <DocumentSidebar
          documents={documents}
          selectedDocId={selectedDocId}
          uploadError={uploadError}
          uploading={uploading}
          fileInputRef={fileInputRef}
          onFileChange={handleUpload}
          onSelectDocument={setSelectedDocId}
        />

        <main className="flex min-h-0 flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/45 px-5 py-3 backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Session Control</p>
              <p className="mt-1 text-sm text-slate-300">
                {sessionId ? `Current session: ${sessionId}` : "No active session yet."}
              </p>
            </div>
            <button
              onClick={resetSession}
              disabled={loading}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
            >
              New Session
            </button>
          </div>

          <ChatPanel
            chatError={chatError}
            input={input}
            loading={loading}
            turns={turns}
            selectedTurnId={selectedTurnId}
            sessionId={sessionId}
            workflowStatus={workflowState?.workflow_status}
            workflowTrace={activeTurnTrace}
            messagesEndRef={messagesEndRef}
            onInputChange={setInput}
            onKeyDown={handleKeyDown}
            onSend={() => void handleSend()}
            onSelectTurn={setSelectedTurnId}
            statusLabel={statusLabel}
            statusTone={statusTone}
          />
        </main>

        <WorkflowSidebar
          loading={loading}
          selectedTurnId={selectedTurnId}
          workflowState={workflowState}
          onSelectTurn={setSelectedTurnId}
          onApprove={handleApproval}
          onReject={handleApproval}
          statusLabel={statusLabel}
          statusTone={statusTone}
        />
      </div>
    </div>
  );
}
