import type { ArtifactRecord, MetricsSummary, TraceEvent, WorkflowState, WorkflowStep } from "../types";
import { formatDuration, formatValue } from "./workflow-utils";

type WorkflowSidebarProps = {
  loading: boolean;
  workflowState: WorkflowState | null;
  onApprove: () => void;
  onReject: () => void;
  statusLabel: (status?: string) => string;
  statusTone: (status?: string) => string;
};

function ApprovalCard({
  loading,
  pendingApprovalGroup,
  onApprove,
  onReject,
}: {
  loading: boolean;
  pendingApprovalGroup?: string;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="mt-5 rounded-3xl border border-amber-300/30 bg-amber-400/10 p-4">
      <p className="text-sm font-medium text-amber-100">Approval required</p>
      <p className="mt-2 text-sm text-amber-50/80">
        Group {pendingApprovalGroup} is waiting for approval.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={onApprove}
          disabled={loading}
          className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={onReject}
          disabled={loading}
          className="rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

function MetricsPanel({ metrics }: { metrics?: MetricsSummary }) {
  return (
    <section className="rounded-3xl border border-white/8 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Metrics</p>
        <span className="text-xs text-slate-500">Live Summary</span>
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
  return (
    <section className="rounded-3xl border border-white/8 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Artifacts</p>
      <div className="mt-3 space-y-3">
        {Object.keys(artifacts).length === 0 ? (
          <p className="text-sm text-slate-500">Artifacts will accumulate as steps complete.</p>
        ) : (
          Object.entries(artifacts).map(([key, artifact]) => (
            <div key={key} className="rounded-2xl border border-white/8 bg-slate-900/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-100">{key}</span>
                <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-emerald-200">
                  {artifact.artifact_type}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{artifact.summary}</p>
              <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950/70 p-3 text-xs text-slate-400 whitespace-pre-wrap">
                {formatValue(artifact.data)}
              </pre>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function TracePanel({ trace }: { trace: TraceEvent[] }) {
  return (
    <section className="rounded-3xl border border-white/8 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Workflow Trace</p>
      <div className="mt-3 space-y-3">
        {trace.length === 0 ? (
          <p className="text-sm text-slate-500">Trace events will appear after workflow execution starts.</p>
        ) : (
          trace.map((event, index) => (
            <div key={`${event.node}-${event.event_type}-${index}`} className="rounded-2xl border border-white/8 bg-slate-900/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-100">{event.event_type}</span>
                <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{event.node}</span>
              </div>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-950/70 p-3 text-xs text-slate-400">
                {formatValue(event.detail)}
              </pre>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function WorkflowSidebar({
  loading,
  workflowState,
  onApprove,
  onReject,
  statusLabel,
  statusTone,
}: WorkflowSidebarProps) {
  const workflowStatus = workflowState?.workflow_status;
  const plan = workflowState?.workflow_plan || [];
  const trace = workflowState?.workflow_trace || [];
  const artifacts = workflowState?.artifacts || {};
  const metrics = workflowState?.metrics_summary;
  const needsApproval = workflowStatus === "awaiting_approval";

  return (
    <aside className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur">
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
          onApprove={onApprove}
          onReject={onReject}
        />
      ) : null}

      <div className="mt-5 space-y-4 overflow-y-auto pr-1">
        <section className="rounded-3xl border border-white/8 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Route Reason</p>
          <p className="mt-2 text-sm text-slate-200">{workflowState?.route_reason || "No workflow yet."}</p>
        </section>

        <MetricsPanel metrics={metrics} />
        <PlanPanel plan={plan} />
        <ArtifactsPanel artifacts={artifacts} />
        <TracePanel trace={trace} />
      </div>
    </aside>
  );
}
