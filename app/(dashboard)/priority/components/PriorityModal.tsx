"use client";

import { useState } from "react";
import { useCreatePriority } from "@/lib/hooks/usePriority";
import { useUsers } from "@/lib/hooks/useUsers";
import { useQuery } from "@tanstack/react-query";
import { fiscalYearLabel, ALL_QUARTERS, getFiscalYear } from "@/lib/utils/fiscal";

interface Team {
  id: string;
  name: string;
}

interface Props {
  defaultYear?: number;
  defaultQuarter?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CURRENT_YEAR = getFiscalYear();
const FISCAL_YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 1 + i);
const WEEK_OPTIONS = Array.from({ length: 13 }, (_, i) => i + 1);

function useTeams() {
  return useQuery<Team[]>({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await fetch("/api/teams");
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch teams");
      return data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function PriorityModal({ defaultYear, defaultQuarter, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    owner: "",
    teamId: "",
    quarter: defaultQuarter ?? "Q1",
    year: String(defaultYear ?? CURRENT_YEAR),
    startWeek: "1",
    endWeek: "13",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useTeams();
  const createPriority = useCreatePriority();

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Priority name is required";
    if (!form.owner) errs.owner = "Owner is required";
    if (!form.quarter) errs.quarter = "Quarter is required";
    if (!form.startWeek) errs.startWeek = "Start week is required";
    if (!form.endWeek) errs.endWeek = "End week is required";
    const sw = parseInt(form.startWeek);
    const ew = parseInt(form.endWeek);
    if (sw && ew && sw > ew) errs.endWeek = "End week must be >= start week";
    return errs;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await createPriority.mutateAsync({
        name: form.name.trim(),
        description: form.description || undefined,
        owner: form.owner,
        teamId: form.teamId || undefined,
        quarter: form.quarter,
        year: parseInt(form.year),
        startWeek: parseInt(form.startWeek),
        endWeek: parseInt(form.endWeek),
        overallStatus: "not-started",
      } as any);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save priority";
      setErrors({ _: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Add New Priority</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {fiscalYearLabel(parseInt(form.year))} · {form.quarter}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {errors._ && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
              {errors._}
            </div>
          )}

          {/* Row 1: Team | Priority Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Team</label>
              <select value={form.teamId} onChange={e => set("teamId", e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
                <option value="">No team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Priority Name <span className="text-red-500">*</span>
              </label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="Enter priority name…"
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 ${errors.name ? "border-red-400" : "border-gray-200"}`} />
              {errors.name && <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>}
            </div>
          </div>

          {/* Row 2: Start Week | Owner */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Start Week <span className="text-red-500">*</span>
              </label>
              <select value={form.startWeek} onChange={e => set("startWeek", e.target.value)}
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white ${errors.startWeek ? "border-red-400" : "border-gray-200"}`}>
                {WEEK_OPTIONS.map(w => <option key={w} value={w}>Week {w}</option>)}
              </select>
              {errors.startWeek && <p className="text-[10px] text-red-500 mt-0.5">{errors.startWeek}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Owner <span className="text-red-500">*</span>
              </label>
              <select value={form.owner} onChange={e => set("owner", e.target.value)}
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white ${errors.owner ? "border-red-400" : "border-gray-200"}`}>
                <option value="">Select owner…</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
              </select>
              {errors.owner && <p className="text-[10px] text-red-500 mt-0.5">{errors.owner}</p>}
            </div>
          </div>

          {/* Row 3: Quarter | End Week */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Quarter <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select value={form.year} onChange={e => set("year", e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
                  {FISCAL_YEARS.map(y => <option key={y} value={y}>{fiscalYearLabel(y)}</option>)}
                </select>
                <select value={form.quarter} onChange={e => set("quarter", e.target.value)}
                  className={`px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white ${errors.quarter ? "border-red-400" : "border-gray-200"}`}>
                  {ALL_QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              {errors.quarter && <p className="text-[10px] text-red-500 mt-0.5">{errors.quarter}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                End Week <span className="text-red-500">*</span>
              </label>
              <select value={form.endWeek} onChange={e => set("endWeek", e.target.value)}
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white ${errors.endWeek ? "border-red-400" : "border-gray-200"}`}>
                {WEEK_OPTIONS.map(w => <option key={w} value={w}>Week {w}</option>)}
              </select>
              {errors.endWeek && <p className="text-[10px] text-red-500 mt-0.5">{errors.endWeek}</p>}
            </div>
          </div>

          {/* Row 4: Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              rows={3} placeholder="Enter description…"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
            {saving && (
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Create Priority
          </button>
        </div>
      </div>
    </div>
  );
}
