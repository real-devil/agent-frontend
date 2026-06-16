"use client";

import { ChatPanel } from "./components/chat-panel";
import { DocumentSidebar } from "./components/document-sidebar";
import { statusLabel, statusTone } from "./components/workflow-utils";
import { WorkflowSidebar } from "./components/workflow-sidebar";
import { useAgentWorkflow } from "./hooks/use-agent-workflow";

export default function Home() {
  const {
    documents,
    fileInputRef,
    input,
    loading,
    messages,
    messagesEndRef,
    selectedDocId,
    sessionId,
    uploadError,
    uploading,
    workflowState,
    setInput,
    setSelectedDocId,
    handleApproval,
    handleKeyDown,
    handleSend,
    handleUpload,
    resetSession,
  } = useAgentWorkflow();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.16),_transparent_24%),linear-gradient(180deg,_#050816_0%,_#0f172a_45%,_#020617_100%)] text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1700px] gap-4 p-4 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        <DocumentSidebar
          documents={documents}
          selectedDocId={selectedDocId}
          uploadError={uploadError}
          uploading={uploading}
          fileInputRef={fileInputRef}
          onFileChange={handleUpload}
          onSelectDocument={setSelectedDocId}
        />

        <main className="flex min-h-[70vh] flex-col gap-4">
          <div className="flex items-center justify-between rounded-[22px] border border-white/10 bg-slate-950/45 px-5 py-3 backdrop-blur">
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
            input={input}
            loading={loading}
            messages={messages}
            sessionId={sessionId}
            workflowStatus={workflowState?.workflow_status}
            messagesEndRef={messagesEndRef}
            onInputChange={setInput}
            onKeyDown={handleKeyDown}
            onSend={() => void handleSend()}
            statusLabel={statusLabel}
            statusTone={statusTone}
          />
        </main>

        <WorkflowSidebar
          loading={loading}
          workflowState={workflowState}
          onApprove={handleApproval}
          onReject={handleApproval}
          statusLabel={statusLabel}
          statusTone={statusTone}
        />
      </div>
    </div>
  );
}
