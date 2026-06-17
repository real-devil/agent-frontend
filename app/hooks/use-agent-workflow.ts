"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  ApprovalDecision,
  ConversationTurn,
  DocumentItem,
  TraceEvent,
  WorkflowState,
} from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

type StreamEventPayload = {
  session_id?: string;
  turn_id?: string;
  current_turn_id?: string;
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
  conversation_turns?: WorkflowState["conversation_turns"];
};

function createOptimisticTurn(userMessage: string): ConversationTurn {
  return {
    turn_id: `optimistic-${Date.now()}`,
    user_message: userMessage,
    reply: "",
    status: "planning",
    workflow_plan: [],
    workflow_trace: [],
    artifacts: {},
    metrics_summary: {},
  };
}

function appendTraceToTurns(
  turns: ConversationTurn[] | undefined,
  currentTurnId: string | undefined,
  trace: TraceEvent | undefined,
): ConversationTurn[] | undefined {
  if (!turns?.length || !currentTurnId || !trace) {
    return turns;
  }

  return turns.map((turn) =>
    turn.turn_id === currentTurnId
      ? {
          ...turn,
          workflow_trace: [...(turn.workflow_trace || []), trace],
        }
      : turn,
  );
}

function resolveTraceTurnId(payload: StreamEventPayload, current?: WorkflowState | null): string | undefined {
  return (
    payload.turn_id ??
    payload.trace?.turn_id ??
    payload.current_turn_id ??
    current?.current_turn_id
  );
}

function filterTraceForTurn(trace: TraceEvent[], turnId?: string): TraceEvent[] {
  if (!turnId) return trace;
  return trace.filter((event) => !event.turn_id || event.turn_id === turnId);
}

export function useAgentWorkflow() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [chatError, setChatError] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [selectedTurnId, setSelectedTurnId] = useState("");
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [streamingAvailable, setStreamingAvailable] = useState(true);
  const [optimisticTurn, setOptimisticTurn] = useState<ConversationTurn | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousLatestTurnIdRef = useRef("");

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
      const data = (await response.json()) as WorkflowState;
      setWorkflowState(data);
      if ((data.conversation_turns || []).length > 0) {
        setOptimisticTurn(null);
      }
    } catch {
      // ignore polling failures so chat stays usable
    }
  }, []);

  const mergeWorkflowState = useCallback(
    (payload: StreamEventPayload) => {
      setWorkflowState((current) => ({
        session_id: payload.session_id || current?.session_id || sessionId || "",
        current_turn_id: payload.current_turn_id ?? current?.current_turn_id,
        workflow_status: payload.workflow_status ?? current?.workflow_status,
        route_reason: payload.route_reason ?? current?.route_reason,
        current_group_index: payload.current_group_index ?? current?.current_group_index,
        pending_approval_group: payload.pending_approval_group ?? current?.pending_approval_group,
        review_decision: payload.review_decision ?? current?.review_decision,
        review_reason: payload.review_reason ?? current?.review_reason,
        workflow_plan: payload.workflow_plan ?? current?.workflow_plan,
        workflow_trace: filterTraceForTurn(
          payload.workflow_trace ?? current?.workflow_trace ?? [],
          payload.current_turn_id ?? current?.current_turn_id,
        ),
        artifacts: payload.artifacts ?? current?.artifacts,
        metrics_summary: payload.metrics_summary ?? current?.metrics_summary,
        conversation_turns: payload.conversation_turns ?? current?.conversation_turns,
      }));

      if ((payload.conversation_turns || []).length > 0) {
        setOptimisticTurn(null);
      }
    },
    [sessionId],
  );

  const consumeSseResponse = useCallback(
    async (response: Response) => {
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
            const traceEvent = payload.trace;
            setWorkflowState((current) => {
              const traceTurnId = resolveTraceTurnId(payload, current);
              const currentTrace = current?.workflow_trace || [];
              const nextTrace = traceEvent ? [...currentTrace, traceEvent] : currentTrace;

              return {
                ...(current || { session_id: payload.session_id || sessionId || "" }),
                workflow_trace: filterTraceForTurn(nextTrace, traceTurnId),
                conversation_turns: appendTraceToTurns(current?.conversation_turns, traceTurnId, traceEvent),
              };
            });
            setOptimisticTurn((current) => {
              if (!current || !payload.trace) return current;
              const traceTurnId = payload.turn_id ?? payload.trace.turn_id;
              if (!traceTurnId) return current;
              return {
                ...current,
                turn_id: traceTurnId,
                workflow_trace: [...(current.workflow_trace || []), payload.trace],
              };
            });
          } else if (eventName === "state") {
            mergeWorkflowState(payload);
          } else if (eventName === "final") {
            mergeWorkflowState(payload);
          } else if (eventName === "error") {
            setChatError(payload.detail || "Unknown streaming error.");
            setOptimisticTurn((current) =>
              current
                ? {
                    ...current,
                    reply: `Stream failed: ${payload.detail || "Unknown error"}`,
                    status: "failed",
                  }
                : current,
            );
          }

          pendingEvent = eventName;
        }
      }
    },
    [mergeWorkflowState, sessionId],
  );

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  const turns = useMemo(() => {
    const serverTurns = workflowState?.conversation_turns || [];
    if (serverTurns.length > 0) {
      return serverTurns;
    }
    return optimisticTurn ? [optimisticTurn] : [];
  }, [optimisticTurn, workflowState?.conversation_turns]);

  useEffect(() => {
    const latestTurnId = turns.at(-1)?.turn_id;
    if (!latestTurnId) {
      previousLatestTurnIdRef.current = "";
      return;
    }

    const previousLatestTurnId = previousLatestTurnIdRef.current;
    setSelectedTurnId((current) => {
      if (!current) return latestTurnId;
      if (!turns.some((turn) => turn.turn_id === current)) return latestTurnId;
      if (current === previousLatestTurnId) return latestTurnId;
      return current;
    });
    previousLatestTurnIdRef.current = latestTurnId;
  }, [turns]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loading, turns]);

  useEffect(() => {
    if (!sessionId) return;

    void fetchWorkflowState(sessionId);
    const timer = setInterval(() => {
      void fetchWorkflowState(sessionId);
    }, 2500);

    return () => clearInterval(timer);
  }, [fetchWorkflowState, sessionId]);

  const resetSession = useCallback(() => {
    setInput("");
    setSessionId("");
    setSelectedTurnId("");
    setWorkflowState(null);
    setOptimisticTurn(null);
    setUploadError("");
    setChatError("");
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

    const nextOptimisticTurn = createOptimisticTurn(text);
    setInput("");
    setChatError("");
    setOptimisticTurn(nextOptimisticTurn);
    setSelectedTurnId(nextOptimisticTurn.turn_id);
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
        const errorMessage = `Request failed: ${data.detail || "Unknown error"}`;
        setChatError(errorMessage);
        setOptimisticTurn((current) =>
          current
            ? {
                ...current,
                reply: errorMessage,
                status: "failed",
              }
            : current,
        );
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
          const errorMessage = `Request failed: ${data.detail || "Unknown error"}`;
          setChatError(errorMessage);
          setOptimisticTurn((current) =>
            current
              ? {
                  ...current,
                  reply: errorMessage,
                  status: "failed",
                }
              : current,
          );
          return;
        }

        setSessionId(data.session_id);
        await fetchWorkflowState(data.session_id);
      } catch {
        setChatError("Network error while sending the message.");
        setOptimisticTurn((current) =>
          current
            ? {
                ...current,
                reply: "Network error while sending the message.",
                status: "failed",
              }
            : current,
        );
      }
    } finally {
      setLoading(false);
    }
  }, [consumeSseResponse, fetchWorkflowState, input, loading, selectedDocId, sessionId]);

  const handleApproval = useCallback(
    async (decision: ApprovalDecision) => {
      if (!sessionId || loading) return;

      setChatError("");
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
          setChatError(`Resume failed: ${data.detail || "Unknown error"}`);
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
            setChatError(`Resume failed: ${data.detail || "Unknown error"}`);
            return;
          }

          await fetchWorkflowState(sessionId);
        } catch {
          setChatError("Network error while resuming the workflow.");
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
    chatError,
    documents,
    fileInputRef,
    input,
    loading,
    messagesEndRef,
    selectedDocId,
    selectedTurnId,
    sessionId,
    streamingAvailable,
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
  };
}
