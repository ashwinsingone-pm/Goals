"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown, Info, Maximize2, Eye, Check,
  Copy, Undo2, Redo2, Bold, Italic, Underline,
  Strikethrough, List, ListOrdered, Quote,
  AlignLeft, Calendar, X, Loader2,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   Types
═══════════════════════════════════════════════ */
interface TargetRow   { category: string; projected: string; y1: string; y2: string; y3: string; y4: string; y5: string; }
interface GoalRow     { category: string; projected: string; q1: string; q2: string; q3: string; q4: string; }
interface ThrustRow   { desc: string; owner: string; }
interface ActionRow   { category: string; projected: string; }
interface KPIAcctRow  { kpi: string; goal: string; }
interface QPriorRow   { priority: string; dueDate: string; }
interface CritCard    { title: string; bullets: string[] }

interface FormData {
  year: number; quarter: string; targetYears: number; status: string;
  employees: string[]; customers: string[]; shareholders: string[];
  coreValues: string; purpose: string; actions: string[];
  profitPerX: string; bhag: string;
  targetRows: TargetRow[]; sandbox: string; keyThrusts: ThrustRow[];
  brandPromiseKPIs: string; brandPromise: string;
  goalRows: GoalRow[]; keyInitiatives: string;
  criticalNumGoals: CritCard; balancingCritNumGoals: CritCard;
  processItems: string[]; weaknesses: string[];
  makeBuy: string[]; sell: string[]; recordKeeping: string[];
  actionsQtr: ActionRow[]; rocks: string;
  criticalNumProcess: CritCard; balancingCritNumProcess: CritCard;
  theme: string; scoreboardDesign: string; celebration: string; reward: string;
  kpiAccountability: KPIAcctRow[]; quarterlyPriorities: QPriorRow[];
  criticalNumAcct: CritCard; balancingCritNumAcct: CritCard;
  trends: string[];
}

/* ── Defaults ── */
const emptyArr3   = (): string[]        => ["", "", ""];
const emptyArr5   = (): string[]        => ["", "", "", "", ""];
const emptyCrit   = (): CritCard        => ({ title: "", bullets: ["", "", "", ""] });
const emptyTarget = (): TargetRow[]     => Array.from({ length: 5 }, () => ({ category:"", projected:"", y1:"", y2:"", y3:"", y4:"", y5:"" }));
const emptyGoal   = (): GoalRow[]       => Array.from({ length: 6 }, () => ({ category:"", projected:"", q1:"", q2:"", q3:"", q4:"" }));
const emptyThrust = (): ThrustRow[]     => Array.from({ length: 5 }, () => ({ desc:"", owner:"" }));
const emptyAction = (): ActionRow[]     => Array.from({ length: 5 }, () => ({ category:"", projected:"" }));
const emptyKPI    = (): KPIAcctRow[]    => Array.from({ length: 5 }, () => ({ kpi:"", goal:"" }));
const emptyQP     = (): QPriorRow[]     => Array.from({ length: 5 }, () => ({ priority:"", dueDate:"" }));

const defaultForm = (): FormData => ({
  year: new Date().getFullYear(), quarter: "Q1", targetYears: 5, status: "draft",
  employees: emptyArr3(), customers: emptyArr3(), shareholders: emptyArr3(),
  coreValues: "", purpose: "", actions: emptyArr5(), profitPerX: "", bhag: "",
  targetRows: emptyTarget(), sandbox: "", keyThrusts: emptyThrust(),
  brandPromiseKPIs: "", brandPromise: "",
  goalRows: emptyGoal(), keyInitiatives: "",
  criticalNumGoals: emptyCrit(), balancingCritNumGoals: emptyCrit(),
  processItems: emptyArr3(), weaknesses: emptyArr3(),
  makeBuy: emptyArr3(), sell: emptyArr3(), recordKeeping: emptyArr3(),
  actionsQtr: emptyAction(), rocks: "",
  criticalNumProcess: emptyCrit(), balancingCritNumProcess: emptyCrit(),
  theme: "", scoreboardDesign: "", celebration: "", reward: "",
  kpiAccountability: emptyKPI(), quarterlyPriorities: emptyQP(),
  criticalNumAcct: emptyCrit(), balancingCritNumAcct: emptyCrit(),
  trends: Array(6).fill(""),
});

/* ═══════════════════════════════════════════════
   Shared UI Components
═══════════════════════════════════════════════ */
function FInput({
  value, onChange, placeholder = "Input text", className,
}: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={cn("w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white", className)} />
  );
}

function FTextarea({
  value, onChange, placeholder = "Input text", rows = 4, className,
}: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; className?: string }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className={cn("w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none bg-white", className)} />
  );
}

/* ── Toolbar button ── */
function TBtn({ icon, onMouseDown }: { icon: React.ReactNode; onMouseDown?: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      className="h-6 w-6 flex items-center justify-center hover:bg-gray-100 rounded text-gray-600"
      onMouseDown={onMouseDown}
    >
      {icon}
    </button>
  );
}
function Sep() { return <span className="w-px h-4 bg-gray-200 mx-0.5" />; }

/* ── Rich Toolbar (functional with execCommand) ── */
function RichToolbar({ editorRef }: { editorRef?: React.RefObject<HTMLDivElement> }) {
  const exec = (cmd: string, val?: string) => {
    if (editorRef?.current) editorRef.current.focus();
    document.execCommand(cmd, false, val ?? undefined);
  };
  return (
    <div className="flex items-center gap-0.5 border-b border-gray-200 pb-1.5 mb-2 flex-wrap">
      <TBtn icon={<Undo2 className="h-3.5 w-3.5" />} onMouseDown={e => { e.preventDefault(); exec("undo"); }} />
      <TBtn icon={<Redo2 className="h-3.5 w-3.5" />} onMouseDown={e => { e.preventDefault(); exec("redo"); }} />
      <Sep />
      <button
        type="button"
        className="flex items-center gap-0.5 h-6 px-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
        onMouseDown={e => { e.preventDefault(); }}
      >
        <AlignLeft className="h-3 w-3" /><ChevronDown className="h-3 w-3" />
      </button>
      <Sep />
      <TBtn icon={<Bold className="h-3.5 w-3.5" />} onMouseDown={e => { e.preventDefault(); exec("bold"); }} />
      <TBtn icon={<Italic className="h-3.5 w-3.5" />} onMouseDown={e => { e.preventDefault(); exec("italic"); }} />
      <TBtn icon={<Underline className="h-3.5 w-3.5" />} onMouseDown={e => { e.preventDefault(); exec("underline"); }} />
      <TBtn icon={<Strikethrough className="h-3.5 w-3.5" />} onMouseDown={e => { e.preventDefault(); exec("strikeThrough"); }} />
      <Sep />
      <TBtn icon={<List className="h-3.5 w-3.5" />} onMouseDown={e => { e.preventDefault(); exec("insertUnorderedList"); }} />
      <TBtn icon={<ListOrdered className="h-3.5 w-3.5" />} onMouseDown={e => { e.preventDefault(); exec("insertOrderedList"); }} />
      <Sep />
      <TBtn icon={<Quote className="h-3.5 w-3.5" />} onMouseDown={e => { e.preventDefault(); exec("formatBlock", "blockquote"); }} />
    </div>
  );
}

/* ── Rich Editor (contentEditable) ── */
function RichEditor({
  value, onChange, placeholder = "Input text", className, resetKey,
}: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; resetKey?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(!value || value === "" || value === "<br>");

  // Re-sync innerHTML when resetKey changes (e.g. quarter/year switch) or on first mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || "";
      setIsEmpty(!value || value === "" || value === "<br>");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    onChange(html);
    setIsEmpty(!html || html === "" || html === "<br>");
  };

  return (
    <div className={cn("flex flex-col min-h-0", className)}>
      <RichToolbar editorRef={editorRef} />
      <div className="relative flex-1 min-h-[80px]">
        {isEmpty && (
          <span className="absolute inset-0 px-3 py-2 text-sm text-gray-400 pointer-events-none select-none">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          style={{ minHeight: "inherit" }}
          className="w-full h-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white overflow-y-auto"
        />
      </div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("border border-gray-200 rounded-lg p-4 bg-white", className)}>{children}</div>;
}
function CardH({ title, subtitle, expand, onExpand }: { title: string; subtitle?: string; expand?: boolean; onExpand?: () => void }) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">{title}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {expand && (
        <button onClick={onExpand} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded p-0.5">
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

const BULLET_COLORS = ["#1a5c2e","#4caf50","#f5c518","#e53935"];
function CritBlock({ label, value, onChange }: { label: string; value: CritCard; onChange: (v: CritCard) => void }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">{label}:</span>
        <input value={value.title} onChange={e => onChange({ ...value, title: e.target.value })}
          placeholder="Enter title here"
          className="flex-1 min-w-0 text-xs border-0 border-b border-dashed border-gray-300 focus:outline-none text-gray-500 placeholder-gray-400 bg-transparent overflow-hidden" />
      </div>
      <div className="space-y-1.5">
        {BULLET_COLORS.map((color, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
            <FInput value={value.bullets[i] ?? ""} onChange={v => {
              const bullets = [...value.bullets]; bullets[i] = v; onChange({ ...value, bullets });
            }} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const CATS = ["Revenue","Profit","Customers","Employees","Retention","Satisfaction","Growth","Other"];
  const [open, setOpen] = useState(false);
  return (
    <div className="relative w-full min-w-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between border border-gray-200 rounded px-2 py-1.5 text-sm bg-white hover:bg-gray-50">
        <span className={cn("min-w-0 flex-1 truncate", value ? "text-gray-700" : "text-gray-400")}>{value || "Select Category"}</span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg w-44 py-1">
            {CATS.map(c => (
              <button key={c} onClick={() => { onChange(c); setOpen(false); }}
                className={cn("w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50", value === c && "text-blue-600 font-medium")}>
                {c}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Tooltip wrapper — shows full text on hover
═══════════════════════════════════════════════ */
function WithTooltip({ content, children, className = "relative min-w-0" }: { content: string; children: React.ReactNode; className?: string }) {
  const [show, setShow] = useState(false);
  const hasContent = !!(content && content.trim());
  return (
    <div className={className} onMouseEnter={() => hasContent && setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && hasContent && (
        <div className="absolute bottom-full left-0 mb-2 z-[9999] bg-gray-900 text-white text-xs rounded-lg px-3 py-2 max-w-sm whitespace-pre-wrap shadow-2xl pointer-events-none min-w-[120px]">
          {content}
          <span className="absolute top-full left-4 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

/* ── Owner selector ── */
const OWNER_OPTIONS = ["CEO","COO","CFO","CTO","CMO","VP Sales","VP Ops","VP Eng","HR Lead","Team Lead","Other"];
function OwnerSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative w-full min-w-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between border border-gray-200 rounded px-2 py-1.5 text-sm bg-white hover:bg-gray-50">
        <span className={cn("min-w-0 flex-1 truncate", value ? "text-gray-700" : "text-gray-400")}>{value || "Select Owner"}</span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg w-44 py-1 max-h-52 overflow-y-auto">
            {OWNER_OPTIONS.map(o => (
              <button key={o} onClick={() => { onChange(o); setOpen(false); }}
                className={cn("w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50", value === o && "text-blue-600 font-medium")}>
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Quarter Dropdown
═══════════════════════════════════════════════ */
function QuarterDropdown({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const [open, setOpen] = useState(false);
  const QUARTERS = ["Q1","Q2","Q3","Q4"];
  const LABELS   = ["Quarter 01","Quarter 02","Quarter 03","Quarter 04"];
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 border-l border-gray-300 hover:bg-gray-50 min-w-[64px] justify-between">
        {value} <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 w-52 p-3">
            <div className="space-y-1">
              {QUARTERS.map((q, i) => (
                <button key={q} onClick={() => { onChange(q); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                    value === q ? "border-blue-600 bg-blue-600" : "border-gray-300")}>
                    {value === q && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className={cn("text-sm", value === q ? "text-gray-900 font-medium" : "text-gray-600")}>{LABELS[i]}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Targets Modal (expand)
═══════════════════════════════════════════════ */
function TargetsModal({ open, onClose, rows, onChange, targetYears }: {
  open: boolean; onClose: () => void;
  rows: TargetRow[]; onChange: (r: TargetRow[]) => void;
  targetYears: number;
}) {
  if (!open) return null;
  const yearCols = Array.from({ length: targetYears }, (_, i) => `Year ${i + 1}`);
  const keys = ["y1","y2","y3","y4","y5"].slice(0, targetYears) as (keyof TargetRow)[];
  const gridStyle = { display: "grid", gap: "12px", gridTemplateColumns: `2fr 1fr ${keys.map(()=>"1fr").join(" ")}` };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <div>
            <p className="text-base font-bold text-gray-900 uppercase tracking-wide">TARGETS (3–5 YRS.)</p>
            <p className="text-xs text-gray-500">(Where)</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 pb-6 overflow-y-auto flex-1">
          {/* Header */}
          <div style={gridStyle} className="text-xs font-medium text-gray-500 pb-2 border-b border-gray-200 mb-2">
            <span>Category</span><span>Projected</span>
            {yearCols.map(y => <span key={y}>{y}</span>)}
          </div>
          {/* Rows */}
          {rows.map((row, i) => (
            <div key={i} style={gridStyle} className="items-center py-2 border-b border-gray-100">
              <CategorySelect value={row.category} onChange={v => {
                const next = [...rows]; next[i] = { ...next[i], category: v }; onChange(next);
              }} />
              <FInput value={row.projected} onChange={v => {
                const next = [...rows]; next[i] = { ...next[i], projected: v }; onChange(next);
              }} placeholder="Number" />
              {keys.map(k => (
                <FInput key={k} value={String(row[k] ?? "")} onChange={v => {
                  const next = [...rows]; (next[i] as any)[k] = v; onChange(next);
                }} placeholder="Number" />
              ))}
            </div>
          ))}
          <div className="flex justify-end mt-5">
            <button onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Goals Modal (expand)
═══════════════════════════════════════════════ */
function GoalsModal({ open, onClose, rows, onChange }: {
  open: boolean; onClose: () => void;
  rows: GoalRow[]; onChange: (r: GoalRow[]) => void;
}) {
  if (!open) return null;
  const qCols: (keyof GoalRow)[] = ["q1","q2","q3","q4"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <div>
            <p className="text-base font-bold text-gray-900 uppercase tracking-wide">GOALS (1 YR.)</p>
            <p className="text-xs text-gray-500">(What)</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 pb-6 overflow-y-auto flex-1">
          <div style={{ display:"grid", gap:"12px", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr" }} className="text-xs font-medium text-gray-500 pb-2 border-b border-gray-200 mb-2">
            <span>Category</span><span>Projected</span>
            {["Quarter 1","Quarter 2","Quarter 3","Quarter 4"].map(q => <span key={q}>{q}</span>)}
          </div>
          {rows.map((row, i) => (
            <div key={i} style={{ display:"grid", gap:"12px", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr" }} className="items-center py-2 border-b border-gray-100">
              <CategorySelect value={row.category} onChange={v => {
                const next = [...rows]; next[i] = { ...next[i], category: v }; onChange(next);
              }} />
              <FInput value={row.projected} onChange={v => {
                const next = [...rows]; next[i] = { ...next[i], projected: v }; onChange(next);
              }} placeholder="Number" />
              {qCols.map(k => (
                <FInput key={k} value={row[k]} onChange={v => {
                  const next = [...rows]; next[i] = { ...next[i], [k]: v }; onChange(next);
                }} placeholder="Number" />
              ))}
            </div>
          ))}
          <div className="flex justify-end mt-5">
            <button onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════ */
export default function OPSPPage() {
  const [form, setForm] = useState<FormData>(defaultForm());
  const [saveState, setSaveState] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [loading, setLoading] = useState(true);
  const [targetsOpen, setTargetsOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const isFirstLoad = useRef(true);
  const skipNextSave = useRef(false);

  /* ── Load on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/opsp?year=${form.year}&quarter=${form.quarter}`);
        if (res.status === 401) {
          // No session (preview mode) — try localStorage
          const draft = localStorage.getItem(`opsp_draft_${form.year}_${form.quarter}`);
          if (draft) {
            try { skipNextSave.current = true; setForm(prev => ({ ...defaultForm(), ...JSON.parse(draft) })); } catch {}
          }
        } else {
          const json = await res.json();
          if (json.data) {
            skipNextSave.current = true;
            setForm(prev => ({ ...defaultForm(), ...json.data, year: json.data.year ?? prev.year, quarter: json.data.quarter ?? prev.quarter }));
          }
        }
      } catch {}
      setLoading(false);
      isFirstLoad.current = false;
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Reload when year/quarter changes ── */
  const loadForPeriod = useCallback(async (year: number, quarter: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/opsp?year=${year}&quarter=${quarter}`);
      if (res.status === 401) {
        const draft = localStorage.getItem(`opsp_draft_${year}_${quarter}`);
        skipNextSave.current = true;
        setForm(prev => {
          if (draft) { try { return { ...defaultForm(), ...JSON.parse(draft), year, quarter }; } catch {} }
          return { ...defaultForm(), year, quarter };
        });
      } else {
        const json = await res.json();
        skipNextSave.current = true;
        setForm(prev => json.data
          ? { ...defaultForm(), ...json.data, year, quarter }
          : { ...defaultForm(), year, quarter });
      }
    } catch {}
    setLoading(false);
  }, []);

  /* ── Autosave with 1.5s debounce ── */
  const save = useCallback(async (data: FormData) => {
    setSaveState("saving");
    try {
      const res = await fetch("/api/opsp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSaveState("saved");
      } else if (res.status === 401) {
        // No session (preview mode) — save to localStorage
        localStorage.setItem(`opsp_draft_${data.year}_${data.quarter}`, JSON.stringify(data));
        setSaveState("saved");
      } else {
        setSaveState("error");
      }
    } catch { setSaveState("error"); }
    setTimeout(() => setSaveState("idle"), 2000);
  }, []);

  useEffect(() => {
    if (isFirstLoad.current) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(form), 1500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [form, save]);

  /* ── Field helpers ── */
  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const setArr = (key: keyof FormData, idx: number, value: string) =>
    setForm(prev => {
      const arr = [...(prev[key] as string[])];
      arr[idx] = value;
      return { ...prev, [key]: arr };
    });

  /* ── Finalize ── */
  const handleFinalize = async () => {
    await fetch("/api/opsp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: form.year, quarter: form.quarter }),
    });
    set("status", "finalized");
  };

  /* ── Header save indicator ── */
  const SaveBadge = () => {
    if (saveState === "saving") return <span className="flex items-center gap-1 text-xs text-gray-400"><Loader2 className="h-3 w-3 animate-spin" />Saving…</span>;
    if (saveState === "saved")  return <span className="text-xs text-green-600">✓ Saved</span>;
    if (saveState === "error")  return <span className="text-xs text-red-500">Save failed</span>;
    return null;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-gray-900">Create OPSP Data</h1>
          <SaveBadge />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-300 rounded-lg text-sm relative">
            <span className="px-3 py-1.5 font-medium text-gray-700 border-r border-gray-300">{form.year}</span>
            <QuarterDropdown value={form.quarter} onChange={q => {
              setForm(prev => ({ ...prev, quarter: q }));
              loadForPeriod(form.year, q);
            }} />
          </div>
          <button className="p-1.5 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50"><Copy className="h-4 w-4" /></button>
          <button onClick={handleFinalize}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm font-medium",
              form.status === "finalized"
                ? "border-green-500 text-green-600 bg-green-50"
                : "border-blue-500 text-blue-600 hover:bg-blue-50")}>
            <Check className="h-4 w-4" />
            {form.status === "finalized" ? "Finalized" : "Finalize"}
          </button>
          <button className="p-1.5 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50"><Eye className="h-4 w-4" /></button>
          <button onClick={() => save(form)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Maximize2 className="h-3.5 w-3.5" /> Update OPSP
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      <TargetsModal open={targetsOpen} onClose={() => setTargetsOpen(false)}
        rows={form.targetRows} onChange={r => set("targetRows", r)} targetYears={form.targetYears} />
      <GoalsModal open={goalsOpen} onClose={() => setGoalsOpen(false)}
        rows={form.goalRows} onChange={r => set("goalRows", r)} />

      <div className="px-6 py-6 space-y-8">

        {/* ══════════════════════════ PEOPLE ══════════════════════════ */}
        <div>
          <div className="mb-4">
            <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">PEOPLE</p>
            <p className="text-xs text-gray-500">(Reputation Drivers)</p>
          </div>

          {/* 3-col people */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {(["employees","customers","shareholders"] as const).map((key, ci) => (
              <div key={key}>
                <p className="text-sm font-medium text-gray-700 mb-2 capitalize">{["Employees","Customers","Shareholders"][ci]}</p>
                <Card className="space-y-2">
                  {[0,1,2].map(i => <FInput key={i} value={(form[key] as string[])[i]} onChange={v => setArr(key, i, v)} />)}
                </Card>
              </div>
            ))}
          </div>

          {/* 4-col grid */}
          <div className="grid grid-cols-4 gap-4">

            {/* Core Values */}
            <Card className="flex flex-col gap-3">
              <CardH title="CORE VALUES/BELIEFS" subtitle="(Should/Shouldn't)" />
              <div className="flex-1 flex flex-col min-h-0">
                <RichEditor value={form.coreValues} onChange={v => set("coreValues", v)} placeholder="Enter core values..." className="flex-1 min-h-0" resetKey={`${form.year}-${form.quarter}`} />
              </div>
            </Card>

            {/* Purpose */}
            <Card className="flex flex-col gap-3">
              <div>
                <CardH title="PURPOSE" subtitle="(Why)" />
                <RichEditor value={form.purpose} onChange={v => set("purpose", v)} placeholder="Enter purpose..." resetKey={`${form.year}-${form.quarter}`} />
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="mb-2">
                  <p className="text-xs font-bold text-gray-800 uppercase">Actions</p>
                  <p className="text-xs text-gray-500">To Live Values, Purposes, BHAG</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {form.actions.map((v, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5">
                      <span className="text-xs text-gray-400 w-5 flex-shrink-0">{String(i+1).padStart(2,"0")}</span>
                      <WithTooltip content={v} className="relative flex-1 min-w-0">
                        <FInput value={v} onChange={nv => setArr("actions", i, nv)} />
                      </WithTooltip>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">Profit per X</p>
                <FInput value={form.profitPerX} onChange={v => set("profitPerX", v)} />
              </div>
              {/* BHAG — fills remaining space */}
              <div className="border-t border-gray-100 pt-3 flex-1 flex flex-col">
                <p className="text-xs font-semibold text-gray-700 mb-2">BHAG®</p>
                <FTextarea value={form.bhag} onChange={v => set("bhag", v)} rows={3} className="flex-1 min-h-[60px]" />
              </div>
            </Card>

            {/* Targets */}
            <Card className="flex flex-col gap-3">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1">
                      TARGETS (3–5 YRS.) <Info className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    </p>
                    <p className="text-xs text-gray-500">(Where)</p>
                  </div>
                  <button onClick={() => setTargetsOpen(true)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded p-0.5">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium pb-1 border-b border-gray-100 mb-1">
                  <span className="flex-1">Category</span><span className="w-16 text-right">Projected</span>
                </div>
                {form.targetRows.slice(0,3).map((row, i) => (
                  <div key={i} className="flex items-center gap-2 py-0.5">
                    <WithTooltip content={row.category} className="relative flex-1 min-w-0">
                      <CategorySelect value={row.category} onChange={v => {
                        const next = [...form.targetRows]; next[i] = { ...next[i], category: v }; set("targetRows", next);
                      }} />
                    </WithTooltip>
                    <WithTooltip content={row.projected} className="relative flex-none">
                      <FInput className="w-16" value={row.projected} placeholder="Num" onChange={v => {
                        const next = [...form.targetRows]; next[i] = { ...next[i], projected: v }; set("targetRows", next);
                      }} />
                    </WithTooltip>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">Sandbox</p>
                <FTextarea value={form.sandbox} onChange={v => set("sandbox", v)} rows={3} />
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="mb-2">
                  <p className="text-xs font-bold text-gray-800 uppercase">Key Thrusts/Capabilities</p>
                  <p className="text-xs text-gray-500">3–5 Year Priorities</p>
                </div>
                {/* Side-by-side: number | description | owner */}
                <div className="divide-y divide-gray-100">
                  {form.keyThrusts.map((row, i) => (
                    <div key={i} className="flex items-center gap-1.5 py-1.5">
                      <span className="text-xs text-gray-400 w-5 flex-shrink-0">{String(i+1).padStart(2,"0")}</span>
                      <WithTooltip content={row.desc} className="relative flex-1 min-w-0">
                        <FInput value={row.desc} placeholder="Capability" onChange={v => {
                          const next = [...form.keyThrusts]; next[i] = { ...next[i], desc: v }; set("keyThrusts", next);
                        }} />
                      </WithTooltip>
                      <WithTooltip content={row.owner} className="relative w-20 flex-shrink-0">
                        <FInput value={row.owner} placeholder="Owner" className="text-xs" onChange={v => {
                          const next = [...form.keyThrusts]; next[i] = { ...next[i], owner: v }; set("keyThrusts", next);
                        }} />
                      </WithTooltip>
                    </div>
                  ))}
                </div>
              </div>
              {/* Brand Promise KPI + Brand Promise — equal split */}
              <div className="border-t border-gray-100 pt-3 flex-1 flex flex-col gap-3">
                <div className="flex-1 flex flex-col">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Brand Promise KPIs</p>
                  <FTextarea value={form.brandPromiseKPIs} onChange={v => set("brandPromiseKPIs", v)} rows={3} className="flex-1 min-h-[60px]" />
                </div>
                <div className="flex-1 flex flex-col">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Brand Promise</p>
                  <FTextarea value={form.brandPromise} onChange={v => set("brandPromise", v)} rows={3} className="flex-1 min-h-[60px]" />
                </div>
              </div>
            </Card>

            {/* Goals */}
            <Card className="flex flex-col gap-3">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1">
                      GOALS (1 YR.) <Info className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    </p>
                    <p className="text-xs text-gray-500">(What)</p>
                  </div>
                  <button onClick={() => setGoalsOpen(true)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded p-0.5">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium pb-1 border-b border-gray-100 mb-1">
                  <span className="flex-1">Category</span><span className="w-16 text-right">Projected</span>
                </div>
                {form.goalRows.slice(0,6).map((row, i) => (
                  <div key={i} className="flex items-center gap-2 py-0.5">
                    <WithTooltip content={row.category} className="relative flex-1 min-w-0">
                      <CategorySelect value={row.category} onChange={v => {
                        const next = [...form.goalRows]; next[i] = { ...next[i], category: v }; set("goalRows", next);
                      }} />
                    </WithTooltip>
                    <WithTooltip content={row.projected} className="relative flex-none">
                      <FInput className="w-16" value={row.projected} placeholder="Num" onChange={v => {
                        const next = [...form.goalRows]; next[i] = { ...next[i], projected: v }; set("goalRows", next);
                      }} />
                    </WithTooltip>
                  </div>
                ))}
              </div>
              {/* Key Initiatives — rich text editor */}
              <div className="border-t border-gray-100 pt-3">
                <div className="mb-2">
                  <p className="text-xs font-bold text-gray-800 uppercase">Key Initiatives</p>
                  <p className="text-xs text-gray-500">1 Year Priorities</p>
                </div>
                <RichEditor
                  value={form.keyInitiatives}
                  onChange={v => set("keyInitiatives", v)}
                  placeholder="Enter key initiatives..."
                  className="min-h-[120px]"
                  resetKey={`${form.year}-${form.quarter}`}
                />
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-3">
                <CritBlock label="Critical #" value={form.criticalNumGoals} onChange={v => set("criticalNumGoals", v)} />
                <CritBlock label="Balancing Critical #" value={form.balancingCritNumGoals} onChange={v => set("balancingCritNumGoals", v)} />
              </div>
            </Card>
          </div>

          {/* Process + Weaknesses */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {(["processItems","weaknesses"] as const).map((key, ci) => (
              <div key={key}>
                <p className="text-sm font-medium text-gray-700 mb-2">{["Process","Weaknesses:"][ci]}</p>
                <Card className="space-y-2">
                  {[0,1,2].map(i => <FInput key={i} value={(form[key] as string[])[i]} onChange={v => setArr(key, i, v)} />)}
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════ PROCESS ══════════════════════════ */}
        <div>
          <div className="mb-4">
            <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">PROCESS</p>
            <p className="text-xs text-gray-500">(Productivity Drivers)</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            {(["makeBuy","sell","recordKeeping"] as const).map((key, ci) => (
              <div key={key}>
                <p className="text-sm font-medium text-gray-700 mb-2">{["Make/Buy","Sell","Record Keeping"][ci]}</p>
                <Card className="space-y-2">
                  {[0,1,2].map(i => <FInput key={i} value={(form[key] as string[])[i]} onChange={v => setArr(key, i, v)} />)}
                </Card>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">

            {/* Actions QTR */}
            <Card className="space-y-4">
              <div>
                <CardH title="ACTIONS (QTR)" subtitle="(How)" expand />
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium pb-1 border-b border-gray-100 mb-1">
                  <span className="flex-1">Category</span><span className="w-16 text-right">Projected</span>
                </div>
                {form.actionsQtr.map((row, i) => (
                  <div key={i} className="flex items-center gap-2 py-0.5">
                    <div className="flex-1 min-w-0">
                      <CategorySelect value={row.category} onChange={v => {
                        const next = [...form.actionsQtr]; next[i] = { ...next[i], category: v }; set("actionsQtr", next);
                      }} />
                    </div>
                    <FInput className="w-16 flex-none" value={row.projected} placeholder="Num" onChange={v => {
                      const next = [...form.actionsQtr]; next[i] = { ...next[i], projected: v }; set("actionsQtr", next);
                    }} />
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3">
                <CardH title="ROCKS" expand />
                <RichEditor value={form.rocks} onChange={v => set("rocks", v)} placeholder="Enter rocks..." resetKey={`${form.year}-${form.quarter}`} />
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-3">
                <CritBlock label="Critical #" value={form.criticalNumProcess} onChange={v => set("criticalNumProcess", v)} />
                <CritBlock label="Balancing Critical #" value={form.balancingCritNumProcess} onChange={v => set("balancingCritNumProcess", v)} />
              </div>
            </Card>

            {/* Theme — equal split between all 4 sections */}
            <Card className="flex flex-col gap-0 p-0 overflow-hidden">
              <div className="flex-1 flex flex-col p-4">
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-1">THEME</p>
                <p className="text-xs text-gray-500 mb-2">(QTR/ANNUAL)</p>
                <FTextarea value={form.theme} onChange={v => set("theme", v)} rows={4} className="flex-1 min-h-[60px]" />
              </div>
              <div className="flex-1 flex flex-col p-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-800 uppercase mb-0.5">Scoreboard Design</p>
                <p className="text-xs text-gray-500 mb-2">Describe and/or sketch your design in this space</p>
                <FTextarea value={form.scoreboardDesign} onChange={v => set("scoreboardDesign", v)} rows={3} className="flex-1 min-h-[60px]" />
              </div>
              <div className="flex-1 flex flex-col p-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-800 uppercase mb-2">Celebration</p>
                <FTextarea value={form.celebration} onChange={v => set("celebration", v)} rows={3} className="flex-1 min-h-[60px]" />
              </div>
              <div className="flex-1 flex flex-col p-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-800 uppercase mb-2">Reward</p>
                <FTextarea value={form.reward} onChange={v => set("reward", v)} rows={3} className="flex-1 min-h-[60px]" />
              </div>
            </Card>

            {/* Your Accountability */}
            <Card className="space-y-4">
              <div>
                <CardH title="YOUR ACCOUNTABILITY" subtitle="(Who/When)" expand />
                <div className="text-xs text-gray-500 font-medium grid grid-cols-[28px_1fr_1fr] pb-1 border-b border-gray-100 mb-1">
                  <span>S.no.</span><span>KPIs</span><span>Goal</span>
                </div>
                {form.kpiAccountability.map((row, i) => (
                  <div key={i} className="grid grid-cols-[28px_1fr_1fr] gap-1.5 items-center py-1 border-b border-gray-50">
                    <span className="text-xs text-gray-400">{String(i+1).padStart(2,"0")}</span>
                    <FInput value={row.kpi} onChange={v => {
                      const next = [...form.kpiAccountability]; next[i] = { ...next[i], kpi: v }; set("kpiAccountability", next);
                    }} />
                    <FInput value={row.goal} onChange={v => {
                      const next = [...form.kpiAccountability]; next[i] = { ...next[i], goal: v }; set("kpiAccountability", next);
                    }} />
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="text-xs text-gray-500 font-medium grid grid-cols-[28px_1fr_80px] pb-1 border-b border-gray-100 mb-1">
                  <span>S.no.</span><span>Quarterly Priorities</span><span className="text-right">Due</span>
                </div>
                {form.quarterlyPriorities.map((row, i) => (
                  <div key={i} className="grid grid-cols-[28px_1fr_80px] gap-1.5 items-center py-1 border-b border-gray-50">
                    <span className="text-xs text-gray-400">{String(i+1).padStart(2,"0")}</span>
                    <FInput value={row.priority} onChange={v => {
                      const next = [...form.quarterlyPriorities]; next[i] = { ...next[i], priority: v }; set("quarterlyPriorities", next);
                    }} />
                    <button className="flex items-center justify-between gap-1 w-full border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-50">
                      <span className="truncate">{row.dueDate || "Due Date"}</span>
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-3">
                <CritBlock label="Critical #" value={form.criticalNumAcct} onChange={v => set("criticalNumAcct", v)} />
                <CritBlock label="Balancing Critical #" value={form.balancingCritNumAcct} onChange={v => set("balancingCritNumAcct", v)} />
              </div>
            </Card>
          </div>

          {/* Trends */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Trends</p>
            <div className="grid grid-cols-2 gap-4">
              {[0,1].map(col => (
                <Card key={col} className="space-y-2">
                  {[0,1,2].map(row => {
                    const idx = col * 3 + row;
                    return <FInput key={row} value={form.trends[idx] ?? ""} onChange={v => {
                      const next = [...form.trends]; next[idx] = v; set("trends", next);
                    }} />;
                  })}
                </Card>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
