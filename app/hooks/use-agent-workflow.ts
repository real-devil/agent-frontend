"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { DocumentItem, Message, WorkflowState } from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export function useAgentWorkflow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/document/list`);
      const data = await response.json();
      setDocuments(data);
      if (data.length > 0) {
        setSelectedDocId((current) => current || data[0].document_id);
      }
    } catch {
      // ignore document list failures here
    }
  }, []);

  const fetchWorkflowState = useCallback(async (activeSessionId: string) => {
    try {
      const response = await fetch(`${API_BASE}/agent/state/${activeSessionId}`);
      if (!response.ok) return;
      const data = await response.json();
      setWorkflowState(data);
    } catch {
      // ignore polling failures so chat stays usable
    }
  }, []);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!sessionId) return;

    void fetchWorkflowState(sessionId);
    const timer = setInterval(() => {
      void fetchWorkflowState(sessionId);
    }, 2500);

    return () => clearInterval(timer);
  }, [fetchWorkflowState, sessionId]);

  const handleUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploadError("");
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(`${API_BASE}/document/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          setUploadError(errorData.detail || "Upload failed.");
        } else {
          await fetchDocuments();
        }
      } catch {
        setUploadError("Network error while uploading.");
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [fetchDocuments],
  );

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((previous) => [...previous, { role: "user", content: text }]);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          session_id: sessionId || null,
          document_id: selectedDocId || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessages((previous) => [
          ...previous,
          { role: "assistant", content: `Request failed: ${data.detail || "Unknown error"}` },
        ]);
        return;
      }

      setSessionId(data.session_id);
      setMessages((previous) => [...previous, { role: "assistant", content: data.reply }]);
      await fetchWorkflowState(data.session_id);
    } catch {
      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: "Network error while sending the message." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchWorkflowState, input, loading, selectedDocId, sessionId]);

  const handleApproval = useCallback(
    async (decision: "approved" | "rejected") => {
      if (!sessionId || loading) return;

      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/chat/resume`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            approval_response: decision,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setMessages((previous) => [
            ...previous,
            { role: "assistant", content: `Resume failed: ${data.detail || "Unknown error"}` },
          ]);
          return;
        }

        setMessages((previous) => [...previous, { role: "assistant", content: data.reply }]);
        await fetchWorkflowState(sessionId);
      } catch {
        setMessages((previous) => [
          ...previous,
          { role: "assistant", content: "Network error while resuming the workflow." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [fetchWorkflowState, loading, sessionId],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  return {
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
  };
}
