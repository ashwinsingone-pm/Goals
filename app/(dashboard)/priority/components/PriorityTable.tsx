"use client";

import { useState, useRef, useEffect } from "react";
import type { PriorityRow } from "@/lib/types/priority";
import { ALL_WEEKS, weekDateLabel } from "@/lib/utils/fiscal";
import { PriorityModal } from "./PriorityModal";
import { PriorityLogModal } from "./PriorityLogModal";

// ── Status helpers ────────────────────────────────────────────────────────────

function statusBg(status: string | null | undefined): string {
  if (status === "on-track") return "bg-green-400";
  if (status === "at-risk") return "bg-yellow-400";
  if (status === "behind") return "bg-red-400";
  return "bg-gray-100";
}

const STATUS_PICKER_OPTIONS = [
  { value: "on-track", label: "On Track", color: "bg-green-400" },
  { value: "at-risk", label: "At Risk", color: "bg-yellow-400" },
  { value: "behind", label: "Behind", color: "bg-red-400" },
  { value: "", label: "Clear", color: "bg-gray-200" },
];

// ── Description tooltip ───────────────────────────────────────────────────────

function DescTooltip({ description, children }: { description?: string | null; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  if (!description) return <>{children}</>;
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-gray-900 text-white text-xs rounded-lg p-2.5 z-50 shadow-lg pointer-events-none">
          <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900" />
          <p className="font-medium mb-1 text-gray-200">Description</p>
          <p className="text-gray-300 line-clamp-5 leading-relaxed">{description}</p>
        </div>
      )}
    </div>
  );
}

// ── Status cell popover ───────────────────────────────────────────────────────

interface StatusPickerProps {
  priorityId: string;
  weekNumber: number;
  currentStatus: string;
  onSave: (priorityId: string, weekNumber: number, status: string) => void;
  onClose: () => void;
}

function StatusPicker({ priorityId, weekNumber, currentStatus, onSave, onClose }: StatusPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 min-w-[110px]">
      <p className="text-[10px] text-gray-400 px-3 py-1 font-medium uppercase tracking-wider">Week {weekNumber}</p>
      {STATUS_PICKER_OPTIONS.map(opt => (
        <button key={opt.value}
          onClick={() => { onSave(priorityId, weekNumber, opt.value); onClose(); }}
          className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700 ${currentStatus === opt.value ? "font-semibold" : ""}`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.color}`} />
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  priorities: PriorityRow[];
  onRefresh: () => void;
  year: number;
  quarter: string;
  defaultYear?: number;
  defaultQuarter?: string;
}

export function PriorityTable({ priorities, onRefresh, year, quarter, defaultYear, defaultQuarter }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPriority, setEditPriority] = useState<PriorityRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openPicker, setOpenPicker] = useState<{ priorityId: string; weekNumber: number } | null>(null);

  // Optimistic weekly status updates (priorityId -> weekNumber -> status)
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, Record<number, string>>>({});

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === priorities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(priorities.map(p => p.id)));
    }
  }

  async function handleWeeklyStatusSave(priorityId: string, weekNumber: number, status: string) {
    // Optimistic update
    setOptimisticStatuses(prev => ({
      ...prev,
      [priorityId]: { ...prev[priorityId], [weekNumber]: status },
    }));
    try {
      await fetch(`/api/priority/${priorityId}/weekly`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekNumber, status }),
      });
      onRefresh();
    } catch {
      // revert
      setOptimisticStatuses(prev => {
        const copy = { ...prev };
        if (copy[priorityId]) {
          const inner = { ...copy[priorityId] };
          delete inner[weekNumber];
          copy[priorityId] = inner;
        }
        return copy;
      });
    }
  }

  function getWeekStatus(priority: PriorityRow, weekNumber: number): string {
    const optimistic = optimisticStatuses[priority.id]?.[weekNumber];
    if (optimistic !== undefined) return optimistic;
    const ws = priority.weeklyStatuses.find(s => s.weekNumber === weekNumber);
    return ws?.status ?? "";
  }

  function isInRange(priority: PriorityRow, weekNumber: number): boolean {
    const sw = priority.startWeek ?? 1;
    const ew = priority.endWeek ?? 13;
    return weekNumber >= sw && weekNumber <= ew;
  }

  // Column offsets for sticky positioning
  // checkbox(40) + log(40) + id(40) + team(120) + name(200) + owner(140) = 580
  const stickyOffsets = [0, 40, 80, 120, 240, 440];

  const STICKY_COLS = [
    { label: "", width: 40 },   // checkbox
    { label: "", width: 40 },   // log icon
    { label: "ID", width: 40 },
    { label: "Team", width: 120 },
    { label: "Priority Name", width: 200 },
    { label: "Owner", width: 140 },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white flex-shrink-0">
        <span className="text-xs text-gray-400">
          {priorities.length} {priorities.length === 1 ? "priority" : "priorities"}
        </span>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition-colors">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="border-collapse" style={{ minWidth: "max-content" }}>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {/* Sticky header cells */}
              {STICKY_COLS.map((col, i) => (
                <th key={i}
                  className="sticky top-0 z-30 bg-gray-50 border-b border-gray-200 border-r border-r-gray-200 text-left px-2 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap select-none"
                  style={{
                    left: stickyOffsets[i],
                    width: col.width,
                    minWidth: col.width,
                    boxShadow: i === STICKY_COLS.length - 1 ? "2px 0 4px -1px rgba(0,0,0,0.08)" : undefined,
                  }}>
                  {i === 0 ? (
                    <input type="checkbox"
                      checked={selectedIds.size === priorities.length && priorities.length > 0}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-blue-600 cursor-pointer" />
                  ) : col.label}
                </th>
              ))}

              {/* Week header cells */}
              {ALL_WEEKS.map(w => (
                <th key={w}
                  className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 border-r border-r-gray-100 text-center px-1 py-2 text-[10px] font-semibold text-gray-500 whitespace-nowrap select-none"
                  style={{ minWidth: 64 }}>
                  <div>W{w}</div>
                  <div className="text-[9px] font-normal text-gray-400">{weekDateLabel(year, quarter, w)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {priorities.length === 0 && (
              <tr>
                <td colSpan={6 + ALL_WEEKS.length} className="text-center py-12 text-xs text-gray-400">
                  No priorities found for this period
                </td>
              </tr>
            )}
            {priorities.map((priority, rowIdx) => {
              const ownerName = priority.owner_user
                ? `${priority.owner_user.firstName} ${priority.owner_user.lastName}`
                : "—";
              return (
                <tr key={priority.id}
                  className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                  {/* Checkbox */}
                  <td className="sticky left-0 z-20 border-r border-gray-100 px-2 py-1.5 bg-inherit"
                    style={{ left: 0, width: 40, minWidth: 40 }}>
                    <input type="checkbox"
                      checked={selectedIds.has(priority.id)}
                      onChange={() => toggleSelect(priority.id)}
                      className="rounded border-gray-300 text-blue-600 cursor-pointer" />
                  </td>

                  {/* Log icon */}
                  <td className="sticky z-20 border-r border-gray-100 px-1 py-1.5 text-center bg-inherit"
                    style={{ left: 40, width: 40, minWidth: 40 }}>
                    <button onClick={() => setEditPriority(priority)}
                      className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit priority">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </td>

                  {/* ID */}
                  <td className="sticky z-20 border-r border-gray-100 px-1 py-1.5 text-center bg-inherit"
                    style={{ left: 80, width: 40, minWidth: 40 }}>
                    <button onClick={() => setEditPriority(priority)}
                      className="text-blue-500 hover:text-blue-700 font-medium text-xs transition-colors">
                      {rowIdx + 1}
                    </button>
                  </td>

                  {/* Team */}
                  <td className="sticky z-20 border-r border-gray-100 px-2 py-1.5 bg-inherit"
                    style={{ left: 120, width: 120, minWidth: 120 }}>
                    <span className="text-xs text-gray-600 truncate block max-w-[108px]">
                      {priority.team?.name ?? <span className="text-gray-300">—</span>}
                    </span>
                  </td>

                  {/* Priority Name */}
                  <td className="sticky z-20 border-r border-gray-100 px-2 py-1.5 bg-inherit"
                    style={{ left: 240, width: 200, minWidth: 200, boxShadow: "2px 0 4px -1px rgba(0,0,0,0.08)" }}>
                    <DescTooltip description={priority.description}>
                      <span className="text-xs text-gray-800 font-medium truncate block max-w-[188px] cursor-default">
                        {priority.name}
                      </span>
                    </DescTooltip>
                  </td>

                  {/* Owner */}
                  <td className="sticky z-20 border-r border-gray-200 px-2 py-1.5 bg-inherit"
                    style={{ left: 440, width: 140, minWidth: 140, boxShadow: "2px 0 4px -1px rgba(0,0,0,0.08)" }}>
                    <span className="text-xs text-gray-600 truncate block max-w-[128px]">{ownerName}</span>
                  </td>

                  {/* Week cells */}
                  {ALL_WEEKS.map(w => {
                    const inRange = isInRange(priority, w);
                    const status = getWeekStatus(priority, w);
                    const isOpen = openPicker?.priorityId === priority.id && openPicker?.weekNumber === w;

                    if (!inRange) {
                      return (
                        <td key={w} className="border-r border-gray-100 px-0 py-0 bg-gray-50" style={{ minWidth: 64, height: 34 }} />
                      );
                    }

                    return (
                      <td key={w} className="relative border-r border-gray-100 px-0 py-0" style={{ minWidth: 64, height: 34 }}>
                        <button
                          onClick={() => setOpenPicker(isOpen ? null : { priorityId: priority.id, weekNumber: w })}
                          className={`w-full h-full flex items-center justify-center transition-opacity hover:opacity-80 ${statusBg(status)}`}
                          style={{ minHeight: 34 }}
                          title={status || "Click to set status"}>
                          {status && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                          )}
                        </button>
                        {isOpen && (
                          <StatusPicker
                            priorityId={priority.id}
                            weekNumber={w}
                            currentStatus={status}
                            onSave={handleWeeklyStatusSave}
                            onClose={() => setOpenPicker(null)}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add New Modal */}
      {showAddModal && (
        <PriorityModal
          defaultYear={defaultYear ?? year}
          defaultQuarter={defaultQuarter ?? quarter}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); onRefresh(); }}
        />
      )}

      {/* Edit Modal */}
      {editPriority && (
        <PriorityLogModal
          priority={editPriority}
          onClose={() => setEditPriority(null)}
          onSuccess={() => { setEditPriority(null); onRefresh(); }}
        />
      )}
    </div>
  );
}
