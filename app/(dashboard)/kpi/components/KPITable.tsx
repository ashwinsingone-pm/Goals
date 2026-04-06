"use client";

import { useState, useRef, useEffect } from "react";
import type { KPIRow, WeeklyValue } from "@/lib/types/kpi";
import { ALL_WEEKS, weekDateLabel } from "@/lib/utils/fiscal";
import { progressColor, weekCellColors } from "@/lib/utils/kpiHelpers";
import { useTableColumns, ALL_STATIC_COLS, COL_LABELS, SORT_KEYS } from "../hooks/useTableColumns";
import { useStickyOffsets } from "../hooks/useStickyOffsets";
import { LogModal } from "./LogModal";
import { KPILogsModal } from "./KPILogsModal";

// ── Sub-components ───────────────────────────────────────────────────────────

function WeekTooltip({ weekNumber, note, children }: {
  weekNumber: number; note?: string | null; children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  if (!note) return <>{children}</>;
  return (
    <div className="relative inline-flex justify-center w-full h-full"
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-52 bg-gray-900 text-white text-xs rounded-lg p-3 z-50 shadow-xl pointer-events-none">
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
          <p className="font-semibold text-gray-200 mb-1.5 text-[11px]">Week {weekNumber} · Note</p>
          <p className="text-gray-300 text-[11px] leading-relaxed whitespace-pre-wrap">{note}</p>
        </div>
      )}
    </div>
  );
}

function DescTooltip({ description, lastNotes, lastNotesAt, children }: {
  description?: string | null; lastNotes?: string | null; lastNotesAt?: string | null; children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const text = lastNotes || description;
  if (!text) return <>{children}</>;
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-gray-900 text-white text-xs rounded-lg p-2.5 z-50 shadow-lg pointer-events-none">
          <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900" />
          <p className="font-medium mb-1 text-gray-200">Last Note</p>
          <p className="text-gray-300 line-clamp-4">{text}</p>
          {lastNotesAt && (
            <p className="text-gray-500 mt-1.5 text-[10px]">
              {new Date(lastNotesAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ColMenu({ colKey, onSort, onFreeze, onHide, frozen = false, showSort = true }: {
  colKey: string; onSort: (dir: "asc" | "desc") => void; onFreeze: () => void; onHide: () => void;
  frozen?: boolean; showSort?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 text-xs">
          {showSort && (<>
            <button onClick={() => { onSort("asc"); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-50 text-gray-700">
              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>Sort Ascending
            </button>
            <button onClick={() => { onSort("desc"); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-50 text-gray-700">
              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>Sort Descending
            </button>
          </>)}
          <button onClick={() => { onFreeze(); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-50 text-gray-700">
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {frozen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
            </svg>{frozen ? "Unfreeze Column" : "Freeze Column"}
          </button>
          <button onClick={() => { onHide(); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-50 text-gray-700">
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>Hide
          </button>
        </div>
      )}
    </div>
  );
}

export function HiddenColsMenu({ hiddenCols, allCols, onShow }: {
  hiddenCols: Set<string>; allCols: string[]; onShow: (col: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const hidden = allCols.filter(c => hiddenCols.has(c));
  if (!hidden.length) return null;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-amber-50 border border-amber-200 text-amber-700 rounded-md hover:bg-amber-100 transition-colors">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>{hidden.length} hidden
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          <p className="text-[10px] text-gray-400 px-3 py-1.5 font-medium uppercase tracking-wider">Hidden Columns</p>
          {hidden.map(col => (
            <button key={col} onClick={() => onShow(col)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700">
              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>Show &ldquo;{COL_LABELS[col] ?? col}&rdquo;
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Lock icon for freeze boundary ────────────────────────────────────────────

function FreezeIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-3 w-3 text-blue-400 flex-shrink-0 ${className}`} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  );
}

// ── Resize handle ────────────────────────────────────────────────────────────

function ResizeHandle({ onStart }: { onStart: (e: React.MouseEvent) => void }) {
  return (
    <div className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400/50"
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onStart(e); }} />
  );
}

// ── Main table ───────────────────────────────────────────────────────────────

interface Props {
  kpis: KPIRow[];
  total: number;
  page: number;
  pageSize: number;
  year: number;
  quarter: string;
  onPageChange: (p: number) => void;
  onSort: (col: string, dir: "asc" | "desc") => void;
  onRefresh: () => void;
  onSelectionChange?: (ids: Set<string>) => void;
  clearSelectionTrigger?: number;
  onHiddenColsChange?: (cols: Set<string>) => void;
  showColTrigger?: { col: string; seq: number };
}

export function KPITable({ kpis, total, page, pageSize, year, quarter, onPageChange, onSort, onRefresh, onSelectionChange, clearSelectionTrigger, onHiddenColsChange, showColTrigger }: Props) {
  const allCols = [...ALL_STATIC_COLS, ...ALL_WEEKS.map(w => `week${w}`)];
  const headerRowRef = useRef<HTMLTableRowElement>(null);
  const [logKPI, setLogKPI] = useState<KPIRow | null>(null);
  const [logInitialTab, setLogInitialTab] = useState<"updates" | "edit" | "stats">("updates");
  const [auditKPI, setAuditKPI] = useState<KPIRow | null>(null);

  function openLog(kpi: KPIRow) { setAuditKPI(kpi); }
  function openEdit(kpi: KPIRow) { setLogKPI(kpi); setLogInitialTab("edit"); }

  const {
    colWidths, frozenUpTo, hiddenCols, selectedIds,
    getColWidth, isFrozen, startResize,
    handleFreezeCol, handleHideCol, handleShowCol,
    toggleSelect, toggleAll, clearSelection,
  } = useTableColumns(allCols, kpis.map(k => k.id));

  const { getStickyLeft } = useStickyOffsets(headerRowRef, frozenUpTo, hiddenCols, colWidths);

  // Notify parent when selection changes
  useEffect(() => { onSelectionChange?.(selectedIds); }, [selectedIds, onSelectionChange]);

  // Clear selection when parent requests it
  useEffect(() => { if (clearSelectionTrigger) clearSelection(); }, [clearSelectionTrigger]);

  // Notify parent when hidden cols change
  useEffect(() => { onHiddenColsChange?.(hiddenCols); }, [hiddenCols, onHiddenColsChange]);

  // Show col when parent requests it
  useEffect(() => { if (showColTrigger) handleShowCol(showColTrigger.col); }, [showColTrigger]);

  const totalPages = Math.ceil(total / pageSize);
  const visibleStaticCols = ALL_STATIC_COLS.filter(c => !hiddenCols.has(c));
  const visibleWeekCols = ALL_WEEKS.filter(w => !hiddenCols.has(`week${w}`));

  function thClass(col: string) {
    const sticky = isFrozen(col);
    const boundary = col === frozenUpTo;
    return [
      "group text-left text-xs font-semibold text-gray-500 bg-gray-50",
      "border-b border-r border-gray-200 select-none",
      sticky ? `sticky z-[35]${boundary ? " shadow-[2px_0_4px_rgba(0,0,0,0.06)]" : ""}` : "",
    ].join(" ");
  }

  function tdClass(col: string, extra = "") {
    const sticky = isFrozen(col);
    const boundary = col === frozenUpTo;
    return [
      "px-3 py-2 text-xs text-gray-700 border-b border-r border-gray-100",
      extra,
      sticky ? `sticky z-[15] bg-white${boundary ? " shadow-[2px_0_4px_rgba(0,0,0,0.04)]" : ""}` : "",
    ].join(" ");
  }

  function stickyStyle(col: string, w: number) {
    return isFrozen(col) ? { left: getStickyLeft(col), width: w } : { width: w };
  }

  return (
    <div className="flex flex-col h-full">

      <div className="flex-1 overflow-auto">
        <table className="border-separate border-spacing-0 text-xs" style={{ tableLayout: "fixed", minWidth: "100%" }}>
          <thead className="sticky top-0 z-30">
            <tr ref={headerRowRef}>
              {/* Fixed columns: Checkbox, Log, ID */}
              <th data-col-key="_checkbox" className="sticky z-[35] px-2 py-2 bg-gray-50 border-b border-r border-gray-200"
                style={{ left: 0, width: 40, minWidth: 40, maxWidth: 40 }}>
                <input type="checkbox" checked={selectedIds.size === kpis.length && kpis.length > 0}
                  onChange={toggleAll} className="rounded border-gray-300 text-blue-600" />
              </th>
              <th data-col-key="_log" className="sticky z-[35] px-1 py-2 bg-gray-50 border-b border-r border-gray-200 text-xs font-semibold text-gray-500 text-center overflow-hidden"
                style={{ left: 40, width: 40, minWidth: 40, maxWidth: 40 }}>Log</th>
              <th data-col-key="_id" className="sticky z-[35] px-1 py-2 bg-gray-50 border-b border-r border-gray-200 text-xs font-semibold text-gray-500 text-center overflow-hidden"
                style={{ left: 80, width: 40, minWidth: 40, maxWidth: 40 }}>ID</th>

              {/* Dynamic static columns */}
              {visibleStaticCols.map(col => {
                const w = getColWidth(col);
                return (
                  <th key={col} data-col-key={col} className={thClass(col)} style={stickyStyle(col, w)}>
                    <div className="relative h-full">
                      <div className="flex items-center gap-1 px-3 py-2 pr-2">
                        {frozenUpTo === col && <FreezeIcon />}
                        <span className="flex-1 truncate min-w-0">{COL_LABELS[col]}</span>
                        <ColMenu colKey={col} onSort={d => onSort(SORT_KEYS[col] ?? col, d)}
                          onFreeze={() => handleFreezeCol(col)} onHide={() => handleHideCol(col)}
                          frozen={frozenUpTo === col} />
                      </div>
                      <ResizeHandle onStart={(e) => startResize(col, e.clientX)} />
                    </div>
                  </th>
                );
              })}

              {/* Week columns */}
              {visibleWeekCols.map(w => {
                const col = `week${w}`;
                const colW = getColWidth(col);
                return (
                  <th key={w} data-col-key={col} className={thClass(col)} style={stickyStyle(col, colW)}>
                    <div className="relative h-full">
                      <div className="flex items-start gap-1 px-3 py-2 pr-2">
                        {frozenUpTo === col && <FreezeIcon className="mt-0.5" />}
                        <div className="min-w-0 flex-1">
                          <div className="whitespace-nowrap">Week {w}</div>
                          <div className="text-[9px] font-normal text-gray-400 leading-none mt-0.5 whitespace-nowrap">
                            {weekDateLabel(year, quarter, w)}
                          </div>
                        </div>
                        <ColMenu colKey={col} onSort={() => {}} onFreeze={() => handleFreezeCol(col)} onHide={() => handleHideCol(col)}
                          frozen={frozenUpTo === col} showSort={false} />
                      </div>
                      <ResizeHandle onStart={(e) => startResize(col, e.clientX)} />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {kpis.length === 0 ? (
              <tr>
                <td colSpan={3 + visibleStaticCols.length + visibleWeekCols.length}
                  className="px-6 py-12 text-center text-gray-400">
                  No KPIs found. Click <strong>+ Add New</strong> to create one.
                </td>
              </tr>
            ) : kpis.map((kpi, idx) => {
              const colors = progressColor(kpi.progressPercent ?? 0);
              const ownerName = kpi.owner_user ? `${kpi.owner_user.firstName} ${kpi.owner_user.lastName}` : kpi.owner;
              const weekMap: Record<number, WeeklyValue> = {};
              (kpi.weeklyValues ?? []).forEach(wv => { weekMap[wv.weekNumber] = wv; });

              return (
                <tr key={kpi.id} className="hover:bg-blue-50/30 transition-colors">
                  {/* Fixed: Checkbox */}
                  <td className="sticky z-[15] bg-white px-2 py-2 border-b border-r border-gray-100"
                    style={{ left: 0, width: 40, minWidth: 40, maxWidth: 40 }}>
                    <input type="checkbox" checked={selectedIds.has(kpi.id)}
                      onChange={() => toggleSelect(kpi.id)} className="rounded border-gray-300 text-blue-600" />
                  </td>
                  {/* Fixed: Log */}
                  <td className="sticky z-[15] bg-white px-1 py-2 border-b border-r border-gray-100 text-center"
                    style={{ left: 40, width: 40, minWidth: 40, maxWidth: 40 }}>
                    <button onClick={() => openLog(kpi)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors" title="Open log">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </td>
                  {/* Fixed: ID */}
                  <td className="sticky z-[15] bg-white px-1 py-2 border-b border-r border-gray-100 text-center"
                    style={{ left: 80, width: 40, minWidth: 40, maxWidth: 40 }}>
                    <button onClick={() => openEdit(kpi)} className="text-blue-500 hover:underline font-medium">
                      {idx + 1 + (page - 1) * pageSize}
                    </button>
                  </td>

                  {/* Progress */}
                  {!hiddenCols.has("progress") && (
                    <td className={tdClass("progress")} style={stickyStyle("progress", getColWidth("progress"))}>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium w-10 flex-shrink-0 ${colors.text}`}>{(kpi.progressPercent ?? 0).toFixed(0)}%</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[40px]">
                          <div className={`h-2 rounded-full transition-all ${colors.bar}`} style={{ width: `${Math.min(kpi.progressPercent ?? 0, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                  )}
                  {/* Owner */}
                  {!hiddenCols.has("owner") && (
                    <td className={tdClass("owner", "whitespace-nowrap")} style={stickyStyle("owner", getColWidth("owner"))}>{ownerName}</td>
                  )}
                  {/* KPI Name */}
                  {!hiddenCols.has("kpiName") && (
                    <td className={tdClass("kpiName")} style={stickyStyle("kpiName", getColWidth("kpiName"))}>
                      <span className="line-clamp-2 leading-snug">{kpi.name}</span>
                    </td>
                  )}
                  {/* Measurement Unit */}
                  {!hiddenCols.has("measurementUnit") && (
                    <td className={tdClass("measurementUnit", "whitespace-nowrap")} style={stickyStyle("measurementUnit", getColWidth("measurementUnit"))}>{kpi.measurementUnit}</td>
                  )}
                  {/* Target Value */}
                  {!hiddenCols.has("targetValue") && (
                    <td className={tdClass("targetValue")} style={stickyStyle("targetValue", getColWidth("targetValue"))}>{kpi.target ?? "—"}</td>
                  )}
                  {/* Description */}
                  {!hiddenCols.has("description") && (
                    <td className={tdClass("description")} style={stickyStyle("description", getColWidth("description"))}>
                      <DescTooltip description={kpi.description} lastNotes={kpi.lastNotes} lastNotesAt={kpi.lastNotesAt}>
                        <span className="line-clamp-2 text-gray-500 leading-snug cursor-default">
                          {kpi.description ? kpi.description.slice(0, 60) + (kpi.description.length > 60 ? "…" : "") : "—"}
                        </span>
                      </DescTooltip>
                    </td>
                  )}

                  {/* Week columns */}
                  {visibleWeekCols.map(w => {
                    const col = `week${w}`;
                    const wv = weekMap[w];
                    const val = wv?.value;
                    const note = wv?.notes;
                    const { bg, text } = weekCellColors(val, kpi.target);
                    const colW = getColWidth(col);
                    const boundary = col === frozenUpTo;
                    return (
                      <td key={w}
                        className={[
                          "text-xs border-b border-r border-gray-100 text-center font-medium p-0", bg, text,
                          isFrozen(col) ? `sticky z-[15]${boundary ? " shadow-[2px_0_4px_rgba(0,0,0,0.04)]" : ""}` : "",
                        ].join(" ")}
                        style={stickyStyle(col, colW)}>
                        {val !== undefined && val !== null ? (
                          <WeekTooltip weekNumber={w} note={note}>
                            <div className="flex items-center justify-center w-full h-full px-2 py-2 cursor-default">{val}</div>
                          </WeekTooltip>
                        ) : (
                          <div className="flex items-center justify-center px-2 py-2 text-gray-300 font-normal">—</div>
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

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-white flex-shrink-0 text-xs text-gray-500">
        {total === 0 ? (
          <span>No results</span>
        ) : (<>
          <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} results</span>
          <div className="flex items-center gap-2">
            <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40">Previous</button>
            <span className="px-2 py-1 bg-gray-900 text-white rounded">{page}</span>
            <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </>)}
      </div>

      {logKPI && <LogModal kpi={logKPI} onClose={() => setLogKPI(null)} onRefresh={onRefresh} initialTab={logInitialTab} />}
      {auditKPI && <KPILogsModal kpi={auditKPI} onClose={() => setAuditKPI(null)} />}
    </div>
  );
}
