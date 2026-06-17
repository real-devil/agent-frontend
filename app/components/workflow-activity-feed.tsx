"use client";

import { useMemo, useState } from "react";

import type { TraceEvent, WorkflowStep } from "../types";
import { type ActivityRow, buildActivityRows } from "./workflow-activity";

type WorkflowActivityFeedProps = {
  trace?: TraceEvent[];
  workflowPlan?: WorkflowStep[];
  routeReason?: string;
  userMessage?: string;
  loading?: boolean;
  collapsed?: boolean;
};

function StatusIcon({ status }: { status: ActivityRow["status"] }) {
  if (status === "done") {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-[10px] text-emerald-300">
        ✓
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
        <span className="absolute h-4 w-4 animate-ping rounded-full bg-sky-400/20" />
        <span className="relative h-2 w-2 rounded-full bg-sky-400" />
      </span>
    );
  }
  if (status === "waiting") {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-[10px] text-amber-200">
        !
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-400/15 text-[10px] text-rose-200">
        ×
      </span>
    );
  }
  return <span className="h-4 w-4 shrink-0 rounded-full border border-white/15 bg-white/5" />;
}

function ActivityList({ rows, compact }: { rows: ActivityRow[]; compact?: boolean }) {
  return (
    <ul className={`space-y-1 ${compact ? "text-xs" : "text-sm"}`}>
      {rows.map((row) => (
        <li
          key={row.key}
          className="flex items-start gap-2.5"
          style={{ paddingLeft: `${row.indent * 14}px` }}
        >
          <StatusIcon status={row.status} />
          <div className="min-w-0 flex-1">
            <p
              className={
                row.status === "active"
                  ? "font-medium text-slate-100"
                  : row.status === "pending"
                    ? "text-slate-500"
                    : "text-slate-300"
              }
            >
              {row.label}
            </p>
            {row.hint ? <p className="mt-0.5 text-xs leading-5 text-slate-500">{row.hint}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function WorkflowActivityFeed({
  trace = [],
  workflowPlan,
  routeReason,
  userMessage,
  loading = false,
  collapsed = false,
}: WorkflowActivityFeedProps) {
  const [expanded, setExpanded] = useState(!collapsed);

  const rows = useMemo(
    () =>
      buildActivityRows(trace, {
        loading,
        workflowPlan,
        routeReason,
        userMessage,
      }),
    [trace, loading, workflowPlan, routeReason, userMessage],
  );

  const activeRow = rows.find((row) => row.status === "active" || row.status === "waiting");
  const doneCount = rows.filter((row) => row.status === "done").length;

  if (collapsed && !expanded) {
    return (
      <div className="max-w-3xl rounded-3xl rounded-bl-md border border-white/10 bg-white/8 px-5 py-4">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-between gap-3 text-left text-sm text-slate-300 transition hover:text-slate-100"
        >
          <span>
            Executed {doneCount} step{doneCount === 1 ? "" : "s"}
            {activeRow ? ` · last: ${activeRow.label}` : ""}
          </span>
          <span className="text-xs text-slate-500">Show activity</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl rounded-3xl rounded-bl-md border border-white/10 bg-slate-950/70 px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Workflow Activity</p>
          {loading ? (
            <p className="mt-1 text-sm text-slate-200">
              {activeRow?.label || "Running workflow"}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-300">
              {doneCount} step{doneCount === 1 ? "" : "s"} completed
            </p>
          )}
        </div>
        {collapsed ? (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-400 transition hover:bg-white/8 hover:text-slate-200"
          >
            Hide
          </button>
        ) : null}
      </div>

      <div className="mt-4 max-h-64 overflow-y-auto pr-1">
        <ActivityList rows={rows} />
      </div>
    </div>
  );
}
