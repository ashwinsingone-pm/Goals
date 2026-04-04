"use client";

import { useState, useEffect } from "react";
import { useUpdateKPI, useKPI } from "@/lib/hooks/useKPI";
import { motion } from "framer-motion";

interface KPIDetailModalProps {
  kpiId: string;
  onClose: () => void;
}

export function KPIDetailModal({ kpiId, onClose }: KPIDetailModalProps) {
  const { data: kpi, isLoading } = useKPI(kpiId);
  const updateKPI = useUpdateKPI(kpiId);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quarter: "Q1",
    year: new Date().getFullYear(),
    measurementUnit: "Number",
    target: "",
    quarterlyGoal: "",
    qtdGoal: "",
  });
  const [error, setError] = useState("");

  // Update form data when KPI data loads
  useEffect(() => {
    if (kpi) {
      setFormData({
        name: kpi.name || "",
        description: kpi.description || "",
        quarter: kpi.quarter || "Q1",
        year: kpi.year || new Date().getFullYear(),
        measurementUnit: kpi.measurementUnit || "Number",
        target: kpi.target?.toString() || "",
        quarterlyGoal: kpi.quarterlyGoal?.toString() || "",
        qtdGoal: kpi.qtdGoal?.toString() || "",
      });
    }
  }, [kpi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        quarter: formData.quarter as "Q1" | "Q2" | "Q3" | "Q4",
        year: formData.year,
        measurementUnit: formData.measurementUnit as "Number" | "Percentage" | "Currency" | "Ratio",
        target: formData.target ? parseFloat(formData.target) : undefined,
        quarterlyGoal: formData.quarterlyGoal ? parseFloat(formData.quarterlyGoal) : undefined,
        qtdGoal: formData.qtdGoal ? parseFloat(formData.qtdGoal) : undefined,
      };

      await updateKPI.mutateAsync(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update KPI");
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-8 text-center">
          <p className="text-text-secondary">Loading KPI details...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold font-display text-primary">Edit KPI</h2>
            <p className="text-text-secondary mt-1">Update key performance indicator details</p>
          </div>

          {/* Progress Info */}
          {kpi && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-lg">
              <div>
                <p className="text-xs text-text-secondary uppercase font-semibold">Progress</p>
                <p className="text-xl font-bold text-primary mt-1">
                  {kpi.progressPercent.toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary uppercase font-semibold">QTD Achievement</p>
                <p className="text-xl font-bold text-primary mt-1">
                  {kpi.qtdAchieved || 0} / {kpi.qtdGoal || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary uppercase font-semibold">Status</p>
                <p className="text-xl font-bold mt-1">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    kpi.healthStatus === "on-track" ? "bg-success/10 text-success" :
                    kpi.healthStatus === "behind-schedule" ? "bg-warning/10 text-warning" :
                    kpi.healthStatus === "critical" ? "bg-danger/10 text-danger" :
                    "bg-primary/10 text-primary"
                  }`}>
                    {kpi.healthStatus === "on-track" ? "On Track" :
                     kpi.healthStatus === "behind-schedule" ? "Behind Schedule" :
                     kpi.healthStatus === "critical" ? "Critical" : "Complete"}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-danger/10 border border-danger text-danger rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">KPI Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Revenue Growth"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this KPI measures"
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Quarter */}
              <div>
                <label className="block text-sm font-medium mb-1">Quarter *</label>
                <select
                  required
                  value={formData.quarter}
                  onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium mb-1">Year *</label>
                <input
                  type="number"
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Measurement Unit */}
              <div>
                <label className="block text-sm font-medium mb-1">Measurement Unit *</label>
                <select
                  required
                  value={formData.measurementUnit}
                  onChange={(e) => setFormData({ ...formData, measurementUnit: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Number">Number</option>
                  <option value="Percentage">Percentage</option>
                  <option value="Currency">Currency</option>
                  <option value="Ratio">Ratio</option>
                </select>
              </div>

              {/* Target */}
              <div>
                <label className="block text-sm font-medium mb-1">Target</label>
                <input
                  type="number"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  placeholder="Annual target"
                  step="0.01"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Quarterly Goal */}
              <div>
                <label className="block text-sm font-medium mb-1">Quarterly Goal</label>
                <input
                  type="number"
                  value={formData.quarterlyGoal}
                  onChange={(e) => setFormData({ ...formData, quarterlyGoal: e.target.value })}
                  placeholder="Goal for this quarter"
                  step="0.01"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* QTD Goal */}
              <div>
                <label className="block text-sm font-medium mb-1">QTD Goal</label>
                <input
                  type="number"
                  value={formData.qtdGoal}
                  onChange={(e) => setFormData({ ...formData, qtdGoal: e.target.value })}
                  placeholder="Quarter-to-date goal"
                  step="0.01"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={updateKPI.isPending}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {updateKPI.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-border rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
