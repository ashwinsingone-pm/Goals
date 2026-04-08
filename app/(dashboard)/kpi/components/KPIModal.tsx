"use client";

import { useState } from "react";
import { useCreateKPI, useUpdateKPI } from "@/lib/hooks/useKPI";
import { useUsers } from "@/lib/hooks/useUsers";
import type { KPIRow as KPI } from "@/lib/types/kpi";
import type { User } from "@/lib/types/kpi";
import { fiscalYearLabel, MEASUREMENT_UNITS, ALL_QUARTERS, ALL_WEEKS, weekDateLabel } from "@/lib/utils/fiscal";
import { CURRENCIES, getScales, getMultiplier, formatActual } from "@/lib/utils/currency";
import { UserPicker } from "@/components/UserPicker";

interface Props {
  mode: "create" | "edit";
  kpi?: KPI;
  defaultYear?: number;
  defaultQuarter?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const FISCAL_YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 1 + i);

export function KPIModal({ mode, kpi, defaultYear, defaultQuarter, onClose, onSuccess }: Props) {
  const [form, setForm] = useState(() => {
    const measurementUnit = kpi?.measurementUnit ?? "Number";
    const currency = kpi?.currency ?? "USD";
    const savedScale = (measurementUnit === "Currency" ? kpi?.targetScale : null) ?? "";
    const multiplier = measurementUnit === "Currency" ? getMultiplier(currency, savedScale) : 1;
    const storedTarget = kpi?.target ?? 0;
    const displayTarget = multiplier > 1 ? storedTarget / multiplier : storedTarget;
    return {
      name: kpi?.name ?? "",
      description: kpi?.description ?? "",
      owner: kpi?.owner ?? "",
      teamId: kpi?.teamId ?? "",
      quarter: kpi?.quarter ?? defaultQuarter ?? "Q1",
      year: String(kpi?.year ?? defaultYear ?? CURRENT_YEAR),
      measurementUnit,
      target: displayTarget > 0 ? String(displayTarget) : "",
      status: kpi?.status ?? "active",
      currency,
      targetScale: savedScale,
    };
  });

  const { data: users = [] } = useUsers();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const createKPI = useCreateKPI();
  const updateKPI = useUpdateKPI(kpi?.id ?? "");

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  }

  function setMeasurementUnit(val: string) {
    setForm(f => ({ ...f, measurementUnit: val }));
  }

  function setCurrency(val: string) {
    setForm(f => {
      const validScale = getScales(val).find(s => s.label === f.targetScale) ? f.targetScale : "";
      return { ...f, currency: val, targetScale: validScale };
    });
  }

  function setTargetScale(val: string) {
    setForm(f => ({ ...f, targetScale: val }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "KPI name is required";
    if (!form.owner) errs.owner = "Owner is required";
    return errs;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const isCurr = form.measurementUnit === "Currency";
      const multiplier = isCurr ? getMultiplier(form.currency, form.targetScale) : 1;
      const targetNum = form.target ? (parseFloat(form.target) || 0) * multiplier : undefined;
      const payload = {
        name: form.name.trim(),
        description: form.description || undefined,
        owner: form.owner,
        teamId: form.teamId || undefined,
        quarter: form.quarter as "Q1" | "Q2" | "Q3" | "Q4",
        year: parseInt(form.year),
        measurementUnit: form.measurementUnit as "Number" | "Percentage" | "Currency",
        target: targetNum,
        quarterlyGoal: targetNum,
        qtdGoal: targetNum,
        status: form.status as "active" | "paused" | "completed",
        divisionType: "Cumulative" as const,
        currency: isCurr ? form.currency : null,
        targetScale: isCurr ? form.targetScale : null,
      };
      if (mode === "create") {
        await createKPI.mutateAsync(payload);
      } else {
        await updateKPI.mutateAsync(payload);
      }
      onSuccess();
    } catch (err: any) {
      setErrors({ _: err.message || "Failed to save KPI" });
    } finally {
      setSaving(false);
    }
  }

  const isCurrency = form.measurementUnit === "Currency";
  const currencyObj = CURRENCIES.find(c => c.code === form.currency) ?? CURRENCIES[0];
  const scales = getScales(form.currency);
  const multiplier = isCurrency ? getMultiplier(form.currency, form.targetScale) : 1;
  const displayTargetNum = parseFloat(form.target) || 0;
  const actualTarget = displayTargetNum * multiplier;
  const weeklyTarget = actualTarget > 0 ? actualTarget / 13 : 0;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto h-full w-[520px] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              {mode === "create" ? "Add New KPI" : "Edit KPI"}
            </h2>
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

          {/* Owner + KPI Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Owner <span className="text-red-500">*</span>
              </label>
              <UserPicker value={form.owner} onChange={v => set("owner", v)} users={users} error={!!errors.owner} />
              {errors.owner && <p className="text-[10px] text-red-500 mt-0.5">{errors.owner}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                KPI Name <span className="text-red-500">*</span>
              </label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="Enter KPI name…"
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 ${errors.name ? "border-red-400" : "border-gray-200"}`} />
              {errors.name && <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>}
            </div>
          </div>

          {/* Quarter (read-only) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quarter</label>
            <div className="px-3 py-2 text-xs border border-gray-100 rounded-lg bg-gray-50 text-gray-600">
              {fiscalYearLabel(parseInt(form.year))} · {form.quarter}
            </div>
          </div>

          {/* Measurement Unit + Currency */}
          <div className={`grid gap-3 ${isCurrency ? "grid-cols-2" : "grid-cols-1"}`}>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Measurement Unit <span className="text-red-500">*</span>
              </label>
              <select value={form.measurementUnit} onChange={e => setMeasurementUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
                {MEASUREMENT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            {isCurrency && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                <select value={form.currency} onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Target Value */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Target Value</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400">
              {isCurrency && (
                <span className="flex items-center px-2.5 bg-gray-50 border-r border-gray-200 text-xs text-gray-500 select-none whitespace-nowrap flex-shrink-0">
                  {currencyObj.symbol}
                </span>
              )}
              <input type="number" min="0" value={form.target} onChange={e => set("target", e.target.value)}
                placeholder="0"
                className="flex-1 px-3 py-2 text-xs focus:outline-none bg-white min-w-0" />
              {isCurrency && (
                <select value={form.targetScale} onChange={e => setTargetScale(e.target.value)}
                  className="border-l border-gray-200 pl-2 pr-1 py-2 text-xs bg-white focus:outline-none text-gray-600 flex-shrink-0 cursor-pointer">
                  {scales.map(s => (
                    <option key={s.label} value={s.label}>{s.label || "—"}</option>
                  ))}
                </select>
              )}
            </div>
            {isCurrency && form.targetScale && actualTarget > 0 && (
              <p className="text-[10px] text-gray-400 mt-1">
                = {formatActual(actualTarget, currencyObj.symbol, form.currency)}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <div className="flex gap-3">
              {(["active", "paused", "completed"] as const).map(s => (
                <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="status" value={s} checked={form.status === s}
                    onChange={() => set("status", s)} className="text-blue-600" />
                  <span className="text-xs text-gray-600 capitalize">{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={form.description ?? ""} onChange={e => set("description", e.target.value)}
              rows={3} placeholder="Enter description…"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none" />
          </div>

          {/* Target Breakdown (read-only preview) */}
          {actualTarget > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Target Breakdown (Weekly)</label>
              <div className="border border-gray-200 rounded-lg overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      {ALL_WEEKS.map(w => (
                        <th key={w} className="px-2 py-1.5 text-center text-gray-500 font-medium border-r border-gray-200 last:border-r-0 whitespace-nowrap">
                          <div>W{w}</div>
                          <div className="text-[9px] font-normal text-gray-400">{weekDateLabel(parseInt(form.year), form.quarter, w)}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {ALL_WEEKS.map(w => (
                        <td key={w} className="px-2 py-1.5 text-center text-gray-700 border-r border-gray-100 last:border-r-0 whitespace-nowrap">
                          {form.measurementUnit === "Number"
                            ? String(Math.floor(actualTarget / 13) + (13 - w < Math.round(actualTarget % 13) ? 1 : 0))
                            : (actualTarget / 13).toFixed(2)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {isCurrency && form.targetScale
                  ? `${formatActual(actualTarget, currencyObj.symbol, form.currency)} divided equally across 13 weeks`
                  : `Target of ${actualTarget} divided equally across 13 weeks`}
              </p>
            </div>
          )}
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
            {mode === "create" ? "Create KPI" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
