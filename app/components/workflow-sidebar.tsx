import { useState } from "react";

import type {
  ApprovalDecision,
  ArtifactRecord,
  ConversationTurn,
  MetricsSummary,
  WorkflowState,
  WorkflowStep,
} from "../types";
import { formatDuration, formatValue } from "./workflow-utils";
import { TraceTimeline } from "./trace-timeline";

type WorkflowSidebarProps = {
  loading: boolean;
  selectedTurnId: string;
  workflowState: WorkflowState | null;
  onSelectTurn: (turnId: string) => void;
  onApprove: (decision: ApprovalDecision) => void;
  onReject: (decision: ApprovalDecision) => void;
  statusLabel: (status?: string) => string;
  statusTone: (status?: string) => string;
};

type ApprovalCardProps = {
  loading: boolean;
  pendingApprovalGroup?: string;
  pendingSteps: WorkflowStep[];
  onApprove: (decision: ApprovalDecision) => void;
  onReject: (decision: ApprovalDecision) => void;
};

function ApprovalCard({
  loading,
  pendingApprovalGroup,
  pendingSteps,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  return (
    <div className="mt-5 rounded-3xl border border-amber-300/30 bg-amber-400/10 p-4">
      <p className="text-sm font-medium text-amber-100">Approval required</p>
      <p className="mt-2 text-sm text-amber-50/80">
        Group {pendingApprovalGroup} is waiting for approval.
      </p>
      {pendingSteps.length > 0 ? (
        <div className="mt-3 space-y-2 rounded-2xl border border-amber-200/20 bg-slate-950/40 p-3 text-xs text-amber-50/90">
          {pendingSteps.map((step) => (
            <div key={step.id} className="rounded-xl bg-white/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-amber-100">{step.id}</span>
                <span className="rounded-full border border-amber-200/20 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-amber-50/70">
                  {step.agent}
                </span>
              </div>
              <p className="mt-2 text-amber-50/80">{step.goal}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-amber-50/60">
                <span className="rounded-full bg-white/6 px-2 py-1">group {step.parallel_group}</span>
                <span className="rounded-full bg-white/6 px-2 py-1">output {step.output_key || "-"}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onApprove("approved")}
          disabled={loading}
          className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => onReject("rejected")}
          disabled={loading}
          className="rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

function TurnListPanel({
  turns,
  selectedTurnId,
  onSelectTurn,
  statusLabel,
  statusTone,
}: {
  turns: ConversationTurn[];
  selectedTurnId: string;
  onSelectTurn: (turnId: string) => void;
  statusLabel: (status?: string) => string;
  statusTone: (status?: string) => string;
}) {
  return (
    <section className="rounded-3xl border border-white/8 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Turns</p>
        <span className="text-xs text-slate-500">{turns.length}</span>
      </div>
      <div className="mt-3 space-y-2">
        {turns.length === 0 ? (
          <p className="text-sm text-slate-500">Turns will appear after the first request.</p>
        ) : (
          turns.map((turn, index) => {
            const selected = turn.turn_id === selectedTurnId;
            const artifactCount = Object.keys(turn.artifacts || {}).length;
            return (
              <button
                key={turn.turn_id}
                type="button"
                onClick={() => onSelectTurn(turn.turn_id)}
                className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                  selected
                    ? "border-sky-300/30 bg-sky-400/10"
                    : "border-white/8 bg-slate-900/60 hover:border-white/12 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-100">Turn {index + 1}</span>
                  <span className={`rounded-full border px-2 py-1 text-[10px] ${statusTone(turn.status)}`}>
                    {statusLabel(turn.status)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-300">{turn.user_message}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                  <span>{artifactCount} artifacts</span>
                  <span>·</span>
                  <span>{turn.workflow_trace?.length || 0} trace events</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

function MetricsPanel({ metrics }: { metrics?: MetricsSummary }) {
  return (
    <section className="rounded-3xl border border-white/8 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Metrics</p>
        <span className="text-xs text-slate-500">Turn Summary</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-200">
        <div className="rounded-2xl bg-slate-900/60 p-3">
          <div className="text-xs text-slate-500">Duration</div>
          <div className="mt-1 font-medium">{formatDuration(metrics?.total_duration_ms)}</div>
        </div>
        <div className="rounded-2xl bg-slate-900/60 p-3">
          <div className="text-xs text-slate-500">Model Calls</div>
          <div className="mt-1 font-medium">{metrics?.total_model_calls || 0}</div>
        </div>
        <div className="rounded-2xl bg-slate-900/60 p-3">
          <div className="text-xs text-slate-500">Tool Calls</div>
          <div className="mt-1 font-medium">{metrics?.total_tool_calls || 0}</div>
        </div>
        <div className="rounded-2xl bg-slate-900/60 p-3">
          <div className="text-xs text-slate-500">Total Tokens</div>
          <div className="mt-1 font-medium">{metrics?.total_tokens || 0}</div>
        </div>
        <div className="rounded-2xl bg-slate-900/60 p-3">
          <div className="text-xs text-slate-500">Approvals</div>
          <div className="mt-1 font-medium">{metrics?.approval_requests || 0}</div>
        </div>
        <div className="rounded-2xl bg-slate-900/60 p-3">
          <div className="text-xs text-slate-500">Rollbacks</div>
          <div className="mt-1 font-medium">{metrics?.rollback_count || 0}</div>
        </div>
      </div>
      {metrics?.failure_counts && Object.keys(metrics.failure_counts).length > 0 ? (
        <div className="mt-3 rounded-2xl bg-slate-900/60 p-3 text-xs text-slate-300">
          <div className="mb-2 text-slate-500">Failure Categories</div>
          <div className="space-y-1">
            {Object.entries(metrics.failure_counts).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span>{key}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PlanPanel({ plan }: { plan: WorkflowStep[] }) {
  return (
    <section className="rounded-3xl border border-white/8 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Plan</p>
      <div className="mt-3 space-y-3">
        {plan.length === 0 ? (
          <p className="text-sm text-slate-500">Plan will appear after the first request.</p>
        ) : (
          plan.map((step) => (
            <div key={step.id} className="rounded-2xl border border-white/8 bg-slate-900/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-100">{step.id}</span>
                <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-sky-200">
                  {step.agent}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{step.goal}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="rounded-full bg-white/6 px-2 py-1">group {step.parallel_group}</span>
                <span className="rounded-full bg-white/6 px-2 py-1">output {step.output_key || "-"}</span>
                {step.approval_required ? (
                  <span className="rounded-full bg-amber-400/10 px-2 py-1 text-amber-100">approval</span>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function ArtifactsPanel({ artifacts }: { artifacts: Record<string, ArtifactRecord> }) {
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState("");

  function toggleExpanded(key: string) {
    setExpandedKeys((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  async function handleCopy(key: string, artifact: ArtifactRecord) {
    await navigator.clipboard.writeText(formatValue(artifact.data));
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(""), 1200);
  }

  return (
    <section className="rounded-3xl border border-white/8 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Artifacts</p>
        <span className="text-xs text-slate-500">{Object.keys(artifacts).length}</span>
      </div>
      <div className="mt-3 space-y-3">
        {Object.keys(artifacts).length === 0 ? (
          <p className="text-sm text-slate-500">No artifacts for the selected turn.</p>
        ) : (
          Object.entries(artifacts).map(([key, artifact]) => {
            const expanded = Boolean(expandedKeys[key]);
            return (
              <div key={key} className="rounded-2xl border border-white/8 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-100">{key}</span>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-emerald-200">
                    {artifact.artifact_type}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{artifact.summary}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => toggleExpanded(key)}
                    className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-300 transition hover:bg-white/8"
                  >
                    {expanded ? "Collapse" : "Expand"}
                  </button>
                  <button
                    onClick={() => void handleCopy(key, artifact)}
                    className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-300 transition hover:bg-white/8"
                  >
                    {copiedKey === key ? "Copied" : "Copy"}
                  </button>
                </div>
                {expanded ? (
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-950/70 p-3 text-xs text-slate-400">
                    {formatValue(artifact.data)}
                  </pre>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export function WorkflowSidebar({
  loading,
  selectedTurnId,
  workflowState,
  onSelectTurn,
  onApprove,
  onReject,
  statusLabel,
  statusTone,
}: WorkflowSidebarProps) {
  const workflowStatus = workflowState?.workflow_status;
  const turns = workflowState?.conversation_turns || [];
  const selectedTurn = turns.find((turn) => turn.turn_id === selectedTurnId) || turns.at(-1);
  const plan = selectedTurn?.workflow_plan || [];
  const trace = selectedTurn?.workflow_trace || [];
  const artifacts = selectedTurn?.artifacts || {};
  const metrics = selectedTurn?.metrics_summary;
  const needsApproval =
    workflowStatus === "awaiting_approval" && selectedTurn?.turn_id === workflowState?.current_turn_id;
  const pendingGroup = workflowState?.pending_approval_group;

  const pendingSteps = plan.filter((step) => String(step.parallel_group) === String(pendingGroup));

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-[28px] border border-white/10 bg-slate-950/55 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/70">Workflow</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Agent State</h3>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs ${statusTone(workflowStatus)}`}>
          {statusLabel(workflowStatus)}
        </div>
      </div>

      {needsApproval ? (
        <ApprovalCard
          loading={loading}
          pendingApprovalGroup={workflowState?.pending_approval_group}
          pendingSteps={pendingSteps}
          onApprove={onApprove}
          onReject={onReject}
        />
      ) : null}

      <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <TurnListPanel
          turns={turns}
          selectedTurnId={selectedTurnId}
          onSelectTurn={onSelectTurn}
          statusLabel={statusLabel}
          statusTone={statusTone}
        />

        <section className="rounded-3xl border border-white/8 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Route Reason</p>
          <p className="mt-2 text-sm text-slate-200">{selectedTurn?.route_reason || "No selected turn yet."}</p>
        </section>

        <MetricsPanel metrics={metrics} />
        <PlanPanel plan={plan} />
        <ArtifactsPanel artifacts={artifacts} />
        <TraceTimeline trace={trace} />
      </div>
    </aside>
  );
}
