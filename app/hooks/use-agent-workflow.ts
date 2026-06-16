"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ApprovalDecision, DocumentItem, Message, TraceEvent, WorkflowState } from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

type StreamEventPayload = {
  session_id?: string;
  reply?: string;
  detail?: string;
  trace?: TraceEvent;
  workflow_status?: string;
  route_reason?: string;
  current_group_index?: number;
  pending_approval_group?: string;
  review_decision?: string;
  review_reason?: string;
  artifacts?: WorkflowState["artifacts"];
  metrics_summary?: WorkflowState["metrics_summary"];
  workflow_trace?: WorkflowState["workflow_trace"];
  workflow_plan?: WorkflowState["workflow_plan"];
};

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
  const [streamingAvailable, setStreamingAvailable] = useState(true);
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

  const mergeWorkflowState = useCallback((payload: StreamEventPayload) => {
    setWorkflowState((current) => ({
      session_id: payload.session_id || current?.session_id || sessionId || "",
      workflow_status: payload.workflow_status ?? current?.workflow_status,
      route_reason: payload.route_reason ?? current?.route_reason,
      current_group_index: payload.current_group_index ?? current?.current_group_index,
      pending_approval_group: payload.pending_approval_group ?? current?.pending_approval_group,
      review_decision: payload.review_decision ?? current?.review_decision,
      review_reason: payload.review_reason ?? current?.review_reason,
      workflow_plan: payload.workflow_plan ?? current?.workflow_plan,
      workflow_trace: payload.workflow_trace ?? current?.workflow_trace,
      artifacts: payload.artifacts ?? current?.artifacts,
      metrics_summary: payload.metrics_summary ?? current?.metrics_summary,
    }));
  }, [sessionId]);

  const consumeSseResponse = useCallback(async (response: Response) => {
    if (!response.body) {
      throw new Error("Streaming response body is empty.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let pendingEvent = "message";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        const lines = chunk.split("\n");
        let eventName = pendingEvent;
        const dataLines: string[] = [];

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventName = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            dataLines.push(line.slice(6));
          }
        }

        if (!dataLines.length) continue;
        const payload = JSON.parse(dataLines.join("\n")) as StreamEventPayload;

        if (eventName === "session" && payload.session_id) {
          setSessionId(payload.session_id);
          mergeWorkflowState(payload);
        } else if (eventName === "trace") {
          setWorkflowState((current) => {
            const currentTrace = current?.workflow_trace || [];
            return {
              ...(current || { session_id: payload.session_id || sessionId || "" }),
              workflow_trace: payload.trace ? [...currentTrace, payload.trace] : currentTrace,
            };
          });
        } else if (eventName === "state") {
          mergeWorkflowState(payload);
        } else if (eventName === "final") {
          if (payload.reply) {
            setMessages((previous) => [...previous, { role: "assistant", content: payload.reply || "" }]);
          }
          mergeWorkflowState(payload);
        } else if (eventName === "error") {
          setMessages((previous) => [
            ...previous,
            { role: "assistant", content: `Stream failed: ${payload.detail || "Unknown error"}` },
          ]);
        }

        pendingEvent = eventName;
      }
    }
  }, [mergeWorkflowState, sessionId]);

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

  const resetSession = useCallback(() => {
    setMessages([]);
    setInput("");
    setSessionId("");
    setWorkflowState(null);
    setUploadError("");
    setLoading(false);
    setStreamingAvailable(true);
  }, []);

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
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({
          message: text,
          session_id: sessionId || null,
          document_id: selectedDocId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setMessages((previous) => [
          ...previous,
          { role: "assistant", content: `Request failed: ${data.detail || "Unknown error"}` },
        ]);
        return;
      }

      await consumeSseResponse(response);
    } catch {
      setStreamingAvailable(false);
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
      }
    } finally {
      setLoading(false);
    }
  }, [consumeSseResponse, fetchWorkflowState, input, loading, selectedDocId, sessionId]);

  const handleApproval = useCallback(
    async (decision: ApprovalDecision) => {
      if (!sessionId || loading) return;

      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/chat/resume/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
          body: JSON.stringify({
            session_id: sessionId,
            approval_response: decision,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          setMessages((previous) => [
            ...previous,
            { role: "assistant", content: `Resume failed: ${data.detail || "Unknown error"}` },
          ]);
          return;
        }

        await consumeSseResponse(response);
      } catch {
        setStreamingAvailable(false);
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
        }
      } finally {
        setLoading(false);
      }
    },
    [consumeSseResponse, fetchWorkflowState, loading, sessionId],
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
    streamingAvailable,
    setInput,
    setSelectedDocId,
    handleApproval,
    handleKeyDown,
    handleSend,
    handleUpload,
    resetSession,
  };
}
