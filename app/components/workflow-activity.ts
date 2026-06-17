import type { TraceEvent, WorkflowStep } from "../types";

export type ActivityRowStatus = "done" | "active" | "pending" | "waiting" | "error";

export type ActivityRow = {
  key: string;
  label: string;
  hint?: string;
  status: ActivityRowStatus;
  indent: number;
};

type PlanStepDetail = {
  id?: string;
  step_id?: string;
  agent?: string;
  goal?: string;
  group?: number;
};

type GroupStepDetail = {
  step_id?: string;
  agent?: string;
  goal?: string;
};

const AGENT_LABELS: Record<string, string> = {
  research_agent: "Research",
  tool_agent: "Tools",
  rag_agent: "Document Q&A",
  general_agent: "Analysis",
};

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
    ...patch,
  });
}

function seedPlanRows(
  rows: ActivityRow[],
  steps: PlanStepDetail[],
  routeReason?: string,
) {
  upsertRow(rows, {
    key: "plan",
    label: `Planned ${steps.length} step${steps.length === 1 ? "" : "s"}`,
    hint: routeReason ? truncate(routeReason, 96) : undefined,
    status: "done",
    indent: 0,
  });

  for (const step of steps) {
    const stepId = String(step.id || step.step_id || "");
    if (!stepId) continue;
    upsertRow(rows, {
      key: planRowKey(stepId),
      label: formatStepLabel(step.agent, step.goal, stepId),
      status: "pending",
      indent: 1,
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

    switch (event.event_type) {
      case "workflow_started":
        upsertRow(rows, {
          key: "start",
          label: options.userMessage
            ? `Received: ${truncate(options.userMessage, 64)}`
            : "Workflow started",
          status: "done",
          indent: 0,
        });
        break;

      case "workflow_resumed":
        upsertRow(rows, {
          key: "resume",
          label: "Resumed after approval",
          status: "done",
          indent: 0,
        });
        break;

      case "plan_created": {
        const steps = (detail.steps as PlanStepDetail[] | undefined) || [];
        seedPlanRows(rows, steps, String(detail.route_reason || options.routeReason || ""));
        break;
      }

      case "group_started": {
        const groupId = String(detail.group_id ?? "group");
        const steps = (detail.steps as GroupStepDetail[] | undefined) || [];

        if (steps.length > 1) {
          upsertRow(rows, {
            key: `parallel:${groupId}`,
            label: `Running ${steps.length} steps in parallel`,
            status: "active",
            indent: 0,
          });
          for (const step of steps) {
            const stepId = String(step.step_id || "");
            if (!stepId) continue;
            upsertRow(rows, {
              key: stepKey(stepId),
              label: formatStepLabel(step.agent, step.goal, stepId),
              status: "active",
              indent: 1,
            });
          }
        }
        break;
      }

      case "group_executed": {
        const groupId = String(detail.group_id ?? "group");
        upsertRow(rows, {
          key: `parallel:${groupId}`,
          label: `Parallel group ${groupId} completed`,
          status: "done",
          indent: 0,
        });
        break;
      }

      case "step_started": {
        const stepId = String(detail.step_id || "");
        if (!stepId) break;
        const label = formatStepLabel(
          String(detail.agent || ""),
          String(detail.goal || ""),
          stepId,
        );
        const inParallel = rows.some(
          (row) => row.key === `parallel:${detail.parallel_group}` || row.key.startsWith("parallel:"),
        );
        if (!inParallel) {
          setActiveRow(rows, stepKey(stepId), { label, indent: 0 });
        } else {
          upsertRow(rows, {
            key: stepKey(stepId),
            label,
            status: "active",
            indent: 1,
          });
        }
        upsertRow(rows, {
          key: planRowKey(stepId),
          label,
          status: "active",
          indent: 1,
        });
        break;
      }

      case "step_completed": {
        const stepId = String(detail.step_id || "");
        if (!stepId) break;
        upsertRow(rows, {
          key: stepKey(stepId),
          label: formatStepLabel(
            String(detail.agent || ""),
            String(detail.summary || detail.goal || ""),
            stepId,
          ),
          status: "done",
          indent: rows.find((row) => row.key === stepKey(stepId))?.indent ?? 0,
        });
        upsertRow(rows, {
          key: planRowKey(stepId),
          label: formatStepLabel(
            String(detail.agent || ""),
            String(detail.summary || detail.goal || ""),
            stepId,
          ),
          status: "done",
          indent: 1,
        });
        break;
      }

      case "tool_called": {
        const stepId = String(detail.step_id || "tool");
        const toolName = String(detail.tool_name || "tool");
        toolCounter += 1;
        upsertRow(rows, {
          key: toolRowKey(stepId, toolName, toolCounter),
          label: formatToolLabel(toolName),
          hint: detail.tool_args ? truncate(String(detail.tool_args), 80) : undefined,
          status: "active",
          indent: 2,
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
            label: formatToolLabel(toolName),
            status: "done",
            indent: 2,
          });
        }
        break;
      }

      case "approval_requested":
        markPreviousActiveAsDone(rows);
        upsertRow(rows, {
          key: `approval:${detail.group_id}`,
          label: `Waiting for approval · group ${detail.group_id}`,
          status: "waiting",
          indent: 0,
        });
        break;

      case "approval_granted":
        upsertRow(rows, {
          key: `approval:${detail.group_id}`,
          label: `Approval granted · group ${detail.group_id}`,
          status: "done",
          indent: 0,
        });
        break;

      case "approval_rejected":
        upsertRow(rows, {
          key: `approval:${detail.group_id}`,
          label: `Approval rejected · group ${detail.group_id}`,
          status: "error",
          indent: 0,
        });
        break;

      case "approval_skipped":
        upsertRow(rows, {
          key: `approval:${detail.group_id}`,
          label: "Approval not required",
          status: "done",
          indent: 0,
        });
        break;

      case "review_completed":
        upsertRow(rows, {
          key: `review:${eventIndex}`,
          label: `Review · ${String(detail.decision || "continue")}`,
          hint: detail.reason ? truncate(String(detail.reason), 96) : undefined,
          status: "done",
          indent: 0,
        });
        break;

      case "workflow_rolled_back":
        upsertRow(rows, {
          key: `rollback:${eventIndex}`,
          label: "Rolled back to an earlier step",
          hint: detail.rollback_target ? `Target: ${detail.rollback_target}` : undefined,
          status: "waiting",
          indent: 0,
        });
        break;

      case "group_advanced":
        upsertRow(rows, {
          key: `advance:${detail.next_group_index}`,
          label: `Advanced to group ${detail.next_group_index}`,
          status: "done",
          indent: 0,
        });
        break;

      case "final_answer_created":
        setActiveRow(rows, "synthesize", {
          label: "Composing final answer",
          indent: 0,
        });
        break;

      case "workflow_timed_out":
        upsertRow(rows, {
          key: "timeout",
          label: "Workflow timed out",
          status: "error",
          indent: 0,
        });
        break;

      default:
        break;
    }
  }

  if (options.loading) {
    const hasActive = rows.some((row) => row.status === "active" || row.status === "waiting");
    if (!hasActive && trace.length > 0) {
      const last = trace.at(-1);
      if (last) {
        setActiveRow(rows, `fallback:${trace.length}`, {
          label: `${last.node} · ${last.event_type.replace(/_/g, " ")}`,
          indent: 0,
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
    });
  }

  return rows;
}

export function summarizeActivity(rows: ActivityRow[]) {
  const done = rows.filter((row) => row.status === "done").length;
  const total = rows.filter((row) => row.indent === 0 || row.key.startsWith("plan:") || row.key.startsWith("step:")).length;
  return { done, total: Math.max(total, rows.length) };
}
