export type DocumentItem = {
  document_id: string;
  filename: string;
};

export type WorkflowStep = {
  id: string;
  agent: string;
  goal: string;
  parallel_group: number;
  approval_required: boolean;
  depends_on?: string[];
  output_key?: string;
};

export type ArtifactRecord = {
  step_id: string;
  output_key: string;
  agent: string;
  artifact_type: string;
  summary: string;
  confidence: string;
  data: unknown;
};

export type TraceEvent = {
  event_type: string;
  node: string;
  turn_id?: string;
  detail: Record<string, unknown>;
};

export type MetricsSummary = {
  total_duration_ms?: number;
  total_model_calls?: number;
  total_tool_calls?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  approval_requests?: number;
  approval_grants?: number;
  approval_rejections?: number;
  rollback_count?: number;
  failure_counts?: Record<string, number>;
};

export type ConversationTurn = {
  turn_id: string;
  user_message: string;
  reply: string;
  status?: string;
  started_at?: number;
  route_reason?: string;
  review_decision?: string;
  review_reason?: string;
  pending_approval_group?: string;
  workflow_plan?: WorkflowStep[];
  workflow_trace?: TraceEvent[];
  artifacts?: Record<string, ArtifactRecord>;
  metrics_summary?: MetricsSummary;
};

export type WorkflowState = {
  session_id: string;
  current_turn_id?: string;
  workflow_status?: string;
  route_reason?: string;
  current_group_index?: number;
  pending_approval_group?: string;
  review_decision?: string;
  review_reason?: string;
  workflow_plan?: WorkflowStep[];
  workflow_trace?: TraceEvent[];
  artifacts?: Record<string, ArtifactRecord>;
  metrics_summary?: MetricsSummary;
  conversation_turns?: ConversationTurn[];
};

export type ApprovalDecision = "approved" | "rejected";
