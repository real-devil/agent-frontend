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

        <WorkflowSidebar
          loading={loading}
          workflowState={workflowState}
          onApprove={() => void handleApproval("approved")}
          onReject={() => void handleApproval("rejected")}
          statusLabel={statusLabel}
          statusTone={statusTone}
        />
      </div>
    </div>
  );
}
