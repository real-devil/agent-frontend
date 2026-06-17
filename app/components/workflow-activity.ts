import type { ActivityKind, TraceEvent, WorkflowStep } from "../types";

export type ActivityRowStatus = "done" | "active" | "pending" | "waiting" | "error";

export type ActivityRow = {
  key: string;
  label: string;
  hint?: string;
  status: ActivityRowStatus;
  indent: number;
  kind?: ActivityKind;
};

type PlanStepDetail = {
  id?: string;
  step_id?: string;
  agent?: string;
  goal?: string;
  group?: number;
  display_label?: string;
};

type GroupStepDetail = {
  step_id?: string;
  agent?: string;
  goal?: string;
  display_label?: string;
};

const AGENT_LABELS: Record<string, string> = {
  research_agent: "Research",
  tool_agent: "Tools",
  rag_agent: "Document Q&A",
  general_agent: "Analysis",
};

function inferActivityKind(eventType: string): ActivityKind {
  if (eventType === "workflow_started" || eventType === "workflow_resumed") return "session";
  if (eventType === "plan_created") return "plan";
  if (eventType === "group_started" || eventType === "group_executed") return "parallel";
  if (eventType.startsWith("step_")) return "step";
  if (eventType.startsWith("tool_")) return "tool";
  if (eventType.startsWith("approval_")) return "approval";
  if (eventType === "review_completed") return "review";
  if (eventType === "final_answer_created") return "synthesize";
  return "system";
}

function activityKind(event: TraceEvent): ActivityKind {
  return event.activity_kind ?? inferActivityKind(event.event_type);
}

function agentLabel(agent?: string) {
  if (!agent) return "Agent";
  return AGENT_LABELS[agent] || agent.replace(/_/g, " ");
}

function truncate(text: string, max = 72) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function stepKey(stepId: string) {
  return `step:${stepId}`;
}

function planRowKey(stepId: string) {
  return `plan:${stepId}`;
}

function toolRowKey(stepId: string, toolName: string, index: number) {
  return `tool:${stepId}:${toolName}:${index}`;
}

function formatStepLabel(agent?: string, goal?: string, stepId?: string) {
  const goalText = goal ? truncate(goal) : stepId || "Step";
  return `${agentLabel(agent)} · ${goalText}`;
}

function formatToolLabel(toolName?: string) {
  if (!toolName) return "Running tool";
  if (toolName === "search_documents") return "Search documents";
  if (toolName === "get_weather") return "Get weather";
  return toolName.replace(/_/g, " ");
}

function eventLabel(event: TraceEvent, fallback: string) {
  return event.display_label?.trim() || fallback;
}

function indentForKind(kind: ActivityKind, nested = false): number {
  if (kind === "tool") return 2;
  if (kind === "step" || kind === "plan") return nested ? 1 : 0;
  if (kind === "parallel" && nested) return 1;
  return 0;
}

function upsertRow(rows: ActivityRow[], row: ActivityRow) {
  const index = rows.findIndex((item) => item.key === row.key);
  if (index === -1) {
    rows.push(row);
    return;
  }
  rows[index] = { ...rows[index], ...row };
}

function markPreviousActiveAsDone(rows: ActivityRow[]) {
  for (const row of rows) {
    if (row.status === "active") {
      row.status = "done";
    }
  }
}

function setActiveRow(rows: ActivityRow[], key: string, patch?: Partial<ActivityRow>) {
  const status = patch?.status ?? "active";
  if (status === "active") {
    markPreviousActiveAsDone(rows);
  }
  upsertRow(rows, {
    key,
    label: patch?.label || rows.find((row) => row.key === key)?.label || "",
    hint: patch?.hint,
    status,
    indent: patch?.indent ?? rows.find((row) => row.key === key)?.indent ?? 0,
    kind: patch?.kind,
    ...patch,
  });
}

function seedPlanRows(
  rows: ActivityRow[],
  steps: PlanStepDetail[],
  routeReason?: string,
  planLabel?: string,
) {
  upsertRow(rows, {
    key: "plan",
    label: planLabel || `Planned ${steps.length} step${steps.length === 1 ? "" : "s"}`,
    hint: routeReason ? truncate(routeReason, 96) : undefined,
    status: "done",
    indent: 0,
    kind: "plan",
  });

  for (const step of steps) {
    const stepId = String(step.id || step.step_id || "");
    if (!stepId) continue;
    upsertRow(rows, {
      key: planRowKey(stepId),
      label: step.display_label || formatStepLabel(step.agent, step.goal, stepId),
      status: "pending",
      indent: 1,
      kind: "plan",
    });
  }
}

function applyWorkflowPlan(rows: ActivityRow[], plan: WorkflowStep[]) {
  if (rows.some((row) => row.key === "plan")) return;
  seedPlanRows(
    rows,
    plan.map((step) => ({
      id: step.id,
      agent: step.agent,
      goal: step.goal,
      group: step.parallel_group,
      display_label: formatStepLabel(step.agent, step.goal, step.id),
    })),
  );
}

export function buildActivityRows(
  trace: TraceEvent[],
  options: {
    loading?: boolean;
    workflowPlan?: WorkflowStep[];
    routeReason?: string;
    userMessage?: string;
  } = {},
): ActivityRow[] {
  const rows: ActivityRow[] = [];
  let toolCounter = 0;

  if (options.workflowPlan?.length) {
    applyWorkflowPlan(rows, options.workflowPlan);
  }

  for (let eventIndex = 0; eventIndex < trace.length; eventIndex += 1) {
    const event = trace[eventIndex];
    const detail = event.detail;
    const kind = activityKind(event);

    switch (event.event_type) {
      case "workflow_started":
        upsertRow(rows, {
          key: "start",
          label: eventLabel(
            event,
            options.userMessage
              ? `Received: ${truncate(options.userMessage, 64)}`
              : "Workflow started",
          ),
          status: "done",
          indent: 0,
          kind,
        });
        break;

      case "workflow_resumed":
        upsertRow(rows, {
          key: "resume",
          label: eventLabel(event, "Resumed after approval"),
          status: "done",
          indent: 0,
          kind,
        });
        break;

      case "plan_created": {
        const steps = (detail.steps as PlanStepDetail[] | undefined) || [];
        seedPlanRows(
          rows,
          steps,
          String(detail.route_reason || options.routeReason || ""),
          event.display_label,
        );
        break;
      }

      case "group_started": {
        const groupId = String(detail.group_id ?? "group");
        const steps = (detail.steps as GroupStepDetail[] | undefined) || [];

        if (steps.length > 1) {
          upsertRow(rows, {
            key: `parallel:${groupId}`,
            label: eventLabel(event, `Running ${steps.length} steps in parallel`),
            status: "active",
            indent: 0,
            kind,
          });
          for (const step of steps) {
            const stepId = String(step.step_id || "");
            if (!stepId) continue;
            upsertRow(rows, {
              key: stepKey(stepId),
              label: step.display_label || formatStepLabel(step.agent, step.goal, stepId),
              status: "active",
              indent: 1,
              kind: "step",
            });
          }
        }
        break;
      }

      case "group_executed": {
        const groupId = String(detail.group_id ?? "group");
        upsertRow(rows, {
          key: `parallel:${groupId}`,
          label: eventLabel(event, `Parallel group ${groupId} completed`),
          status: "done",
          indent: 0,
          kind,
        });
        break;
      }

      case "step_started": {
        const stepId = String(detail.step_id || "");
        if (!stepId) break;
        const label = eventLabel(
          event,
          formatStepLabel(String(detail.agent || ""), String(detail.goal || ""), stepId),
        );
        const inParallel = rows.some((row) => row.key.startsWith("parallel:"));
        const indent = inParallel ? 1 : indentForKind(kind);
        if (!inParallel) {
          setActiveRow(rows, stepKey(stepId), { label, indent, kind });
        } else {
          upsertRow(rows, {
            key: stepKey(stepId),
            label,
            status: "active",
            indent,
            kind,
          });
        }
        upsertRow(rows, {
          key: planRowKey(stepId),
          label,
          status: "active",
          indent: 1,
          kind,
        });
        break;
      }

      case "step_completed": {
        const stepId = String(detail.step_id || "");
        if (!stepId) break;
        const label = eventLabel(
          event,
          formatStepLabel(
            String(detail.agent || ""),
            String(detail.summary || detail.goal || ""),
            stepId,
          ),
        );
        upsertRow(rows, {
          key: stepKey(stepId),
          label,
          status: "done",
          indent: rows.find((row) => row.key === stepKey(stepId))?.indent ?? indentForKind(kind),
          kind,
        });
        upsertRow(rows, {
          key: planRowKey(stepId),
          label,
          status: "done",
          indent: 1,
          kind,
        });
        break;
      }

      case "tool_called": {
        const stepId = String(detail.step_id || "tool");
        const toolName = String(detail.tool_name || "tool");
        toolCounter += 1;
        upsertRow(rows, {
          key: toolRowKey(stepId, toolName, toolCounter),
          label: eventLabel(event, formatToolLabel(toolName)),
          hint: detail.tool_args ? truncate(String(detail.tool_args), 80) : undefined,
          status: "active",
          indent: indentForKind(kind),
          kind,
        });
        break;
      }

      case "tool_result": {
        const stepId = String(detail.step_id || "tool");
        const toolName = String(detail.tool_name || "tool");
        const matchingKey = rows
          .slice()
          .reverse()
          .find((row) => row.key.startsWith(`tool:${stepId}:${toolName}`))?.key;
        if (matchingKey) {
          upsertRow(rows, {
            key: matchingKey,
            label: eventLabel(event, formatToolLabel(toolName)),
            status: "done",
            indent: indentForKind(kind),
            kind,
          });
        }
        break;
      }

      case "approval_requested":
        markPreviousActiveAsDone(rows);
        upsertRow(rows, {
          key: `approval:${detail.group_id}`,
          label: eventLabel(event, `Waiting for approval · group ${detail.group_id}`),
          status: "waiting",
          indent: 0,
          kind,
        });
        break;

      case "approval_granted":
        upsertRow(rows, {
          key: `approval:${detail.group_id}`,
          label: eventLabel(event, `Approval granted · group ${detail.group_id}`),
          status: "done",
          indent: 0,
          kind,
        });
        break;

      case "approval_rejected":
        upsertRow(rows, {
          key: `approval:${detail.group_id}`,
          label: eventLabel(event, `Approval rejected · group ${detail.group_id}`),
          status: "error",
          indent: 0,
          kind,
        });
        break;

      case "approval_skipped":
        upsertRow(rows, {
          key: `approval:${detail.group_id}`,
          label: eventLabel(event, "Approval not required"),
          status: "done",
          indent: 0,
          kind,
        });
        break;

      case "review_completed":
        upsertRow(rows, {
          key: `review:${eventIndex}`,
          label: eventLabel(event, `Review · ${String(detail.decision || "continue")}`),
          hint: detail.reason ? truncate(String(detail.reason), 96) : undefined,
          status: "done",
          indent: 0,
          kind,
        });
        break;

      case "workflow_rolled_back":
        upsertRow(rows, {
          key: `rollback:${eventIndex}`,
          label: eventLabel(event, "Rolled back to an earlier step"),
          hint: detail.rollback_target ? `Target: ${detail.rollback_target}` : undefined,
          status: "waiting",
          indent: 0,
          kind,
        });
        break;

      case "group_advanced":
        upsertRow(rows, {
          key: `advance:${detail.next_group_index}`,
          label: eventLabel(event, `Advanced to group ${detail.next_group_index}`),
          status: "done",
          indent: 0,
          kind,
        });
        break;

      case "final_answer_created":
        setActiveRow(rows, "synthesize", {
          label: eventLabel(event, "Composing final answer"),
          indent: 0,
          kind,
        });
        break;

      case "workflow_timed_out":
        upsertRow(rows, {
          key: "timeout",
          label: eventLabel(event, "Workflow timed out"),
          status: "error",
          indent: 0,
          kind,
        });
        break;

      default:
        if (event.display_label) {
          upsertRow(rows, {
            key: `generic:${eventIndex}`,
            label: event.display_label,
            status: options.loading ? "active" : "done",
            indent: indentForKind(kind),
            kind,
          });
        }
        break;
    }
  }

  if (options.loading) {
    const hasActive = rows.some((row) => row.status === "active" || row.status === "waiting");
    if (!hasActive && trace.length > 0) {
      const last = trace.at(-1);
      if (last) {
        setActiveRow(rows, `fallback:${trace.length}`, {
          label: eventLabel(last, `${last.node} · ${last.event_type.replace(/_/g, " ")}`),
          indent: 0,
          kind: activityKind(last),
        });
      }
    }
  } else {
    markPreviousActiveAsDone(rows);
  }

  if (rows.length === 0 && options.loading) {
    rows.push({
      key: "preparing",
      label: "Preparing workflow",
      status: "active",
      indent: 0,
      kind: "system",
    });
  }

  return rows;
}

export function summarizeActivity(rows: ActivityRow[]) {
  const done = rows.filter((row) => row.status === "done").length;
  const total = rows.filter(
    (row) => row.indent === 0 || row.key.startsWith("plan:") || row.key.startsWith("step:"),
  ).length;
  return { done, total: Math.max(total, rows.length) };
}
