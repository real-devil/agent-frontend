import { useEffect, useRef, useState } from "react";

import type { TraceEvent } from "../types";
import { formatValue } from "./workflow-utils";

type TraceTimelineProps = {
  trace: TraceEvent[];
};

function TraceDetailDrawer({
  event,
  index,
  onClose,
}: {
  event: TraceEvent | null;
  index: number;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (event) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [event]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-y-0 right-0 m-0 ml-auto h-full w-full max-w-md border-l border-white/10 bg-slate-950/95 p-0 text-slate-100 shadow-[-20px_0_80px_rgba(15,23,42,0.5)] backdrop-blur open:flex open:flex-col"
    >
      {event ? (
        <>
          <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Trace Detail</p>
              <p className="mt-2 text-lg font-medium text-slate-100">{event.event_type}</p>
              <p className="mt-1 text-sm text-slate-400">
                {event.node} · event {index + 1}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/8"
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <pre className="whitespace-pre-wrap rounded-2xl bg-slate-900/70 p-4 text-xs leading-6 text-slate-300">
              {formatValue(event.detail)}
            </pre>
          </div>
        </>
      ) : null}
    </dialog>
  );
}

export function TraceTimeline({ trace }: TraceTimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestIndex = trace.length - 1;
  const hiddenCount = showAll ? 0 : Math.max(0, trace.length - 16);
  const visibleTrace = showAll ? trace : trace.slice(-16);
  const visibleStartIndex = trace.length - visibleTrace.length;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [trace.length, latestIndex]);

  const selectedEvent = selectedIndex === null ? null : trace[selectedIndex] ?? null;

  return (
    <section className="rounded-3xl border border-white/8 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Workflow Trace</p>
        {trace.length > 0 ? <span className="text-xs text-slate-500">{trace.length} events</span> : null}
      </div>

      <div ref={scrollRef} className="mt-3 max-h-[min(50vh,420px)] overflow-y-auto pr-1">
        {trace.length === 0 ? (
          <p className="text-sm text-slate-500">Trace events will appear after workflow execution starts.</p>
        ) : (
          <div className="relative pl-4">
            <div className="absolute bottom-2 left-[7px] top-2 w-px bg-white/10" aria-hidden />
            <div className="space-y-1">
              {hiddenCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="mb-2 w-full rounded-2xl border border-dashed border-white/10 bg-slate-900/40 px-3 py-2 text-xs text-slate-400 transition hover:border-white/20 hover:text-slate-300"
                >
                  Show {hiddenCount} earlier event{hiddenCount === 1 ? "" : "s"}
                </button>
              ) : null}
              {visibleTrace.map((event, offset) => {
                const index = visibleStartIndex + offset;
                const isLatest = index === latestIndex;
                return (
                  <button
                    key={`${event.node}-${event.event_type}-${index}`}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={`relative flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition ${
                      isLatest
                        ? "bg-sky-400/10 ring-1 ring-sky-300/20"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={`relative z-10 h-2.5 w-2.5 shrink-0 rounded-full border ${
                        isLatest
                          ? "border-sky-300 bg-sky-400 shadow-[0_0_0_3px_rgba(56,189,248,0.15)]"
                          : "border-white/20 bg-slate-800"
                      }`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-100">{event.event_type}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{event.node}</span>
                    </span>
                    {isLatest ? (
                      <span className="shrink-0 rounded-full bg-sky-300/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-sky-100">
                        Latest
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] uppercase tracking-[0.15em] text-slate-600">View</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <TraceDetailDrawer
        event={selectedEvent}
        index={selectedIndex ?? 0}
        onClose={() => setSelectedIndex(null)}
      />
    </section>
  );
}
