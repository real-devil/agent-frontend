export function statusLabel(status?: string) {
  switch (status) {
    case "planning":
      return "Planning";
    case "in_progress":
      return "Running";
    case "awaiting_approval":
      return "Approval Needed";
    case "completed":
      return "Completed";
    case "rejected":
      return "Rejected";
    case "resume":
      return "Resuming";
    default:
      return status || "Idle";
  }
}

export function statusTone(status?: string) {
  switch (status) {
    case "completed":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-200";
    case "awaiting_approval":
      return "border-amber-400/40 bg-amber-500/15 text-amber-100";
    case "rejected":
      return "border-rose-400/40 bg-rose-500/15 text-rose-100";
    case "in_progress":
    case "planning":
    case "resume":
      return "border-sky-400/40 bg-sky-500/15 text-sky-100";
    default:
      return "border-slate-600 bg-slate-800/70 text-slate-200";
  }
}

export function formatValue(value: unknown) {
  if (value == null) return "-";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export function formatDuration(duration?: number) {
  if (!duration) return "0 ms";
  if (duration < 1000) return `${duration} ms`;
  return `${(duration / 1000).toFixed(2)} s`;
}
