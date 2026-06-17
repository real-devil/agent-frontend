import type { RefObject } from "react";

import type { DocumentItem } from "../types";

type DocumentSidebarProps = {
  documents: DocumentItem[];
  selectedDocId: string;
  uploadError: string;
  uploading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectDocument: (documentId: string) => void;
};

export function DocumentSidebar({
  documents,
  selectedDocId,
  uploadError,
  uploading,
  fileInputRef,
  onFileChange,
  onSelectDocument,
}: DocumentSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col rounded-[28px] border border-white/10 bg-slate-950/55 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-sky-200/70">Documents</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Agent Console</h1>
        <p className="mt-2 text-sm text-slate-400">
          Upload knowledge files, choose the active document, and let the workflow route the task.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-medium text-slate-200">Upload PDF or Word</p>
        <label className="mt-3 flex h-28 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-500/40 bg-slate-900/60 text-center text-sm text-slate-400 transition hover:border-sky-300/60 hover:text-slate-200">
          <span>{uploading ? "Uploading..." : "Choose a file"}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={onFileChange}
            disabled={uploading}
          />
        </label>
        {uploadError ? <p className="mt-3 text-xs text-rose-300">{uploadError}</p> : null}
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-200">Available documents</p>
          <span className="text-xs text-slate-500">{documents.length}</span>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {documents.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-slate-500">
              No documents uploaded yet.
            </div>
          ) : (
            documents.map((document) => {
              const active = selectedDocId === document.document_id;
              return (
                <button
                  key={document.document_id}
                  onClick={() => onSelectDocument(document.document_id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-sky-400/60 bg-sky-400/15 text-sky-50"
                      : "border-white/8 bg-white/5 text-slate-300 hover:border-slate-400/40 hover:bg-white/8"
                  }`}
                  title={document.filename}
                >
                  <div className="truncate text-sm font-medium">{document.filename}</div>
                  <div className="mt-1 truncate text-[11px] text-slate-500">{document.document_id}</div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
        <p className="uppercase tracking-[0.25em] text-slate-500">Selection</p>
        <p className="mt-2 break-all">
          {selectedDocId
            ? documents.find((item) => item.document_id === selectedDocId)?.filename || selectedDocId
            : "Global conversation without a document scope."}
        </p>
      </div>
    </aside>
  );
}
