"use client";

import { useState } from "react";
import { useCreateKPI } from "@/lib/hooks/useKPI";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

interface KPICreateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function KPICreateForm({ onSuccess, onCancel }: KPICreateFormProps) {
  const { data: session } = useSession();
  const createKPI = useCreateKPI();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    owner: session?.user?.id || "",
    teamId: "",
    parentKPIId: "",
    quarter: "Q1",
    year: new Date().getFullYear(),
    measurementUnit: "Number",
    target: "",
    quarterlyGoal: "",
    qtdGoal: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        owner: formData.owner,
        teamId: formData.teamId || undefined,
        parentKPIId: formData.parentKPIId || undefined,
        quarter: formData.quarter as "Q1" | "Q2" | "Q3" | "Q4",
        year: formData.year,
        measurementUnit: formData.measurementUnit as "Number" | "Percentage" | "Currency" | "Ratio",
        target: formData.target ? parseFloat(formData.target) : undefined,
        quarterlyGoal: formData.quarterlyGoal ? parseFloat(formData.quarterlyGoal) : undefined,
        qtdGoal: formData.qtdGoal ? parseFloat(formData.qtdGoal) : undefined,
        status: "active" as const,
      };

      await createKPI.mutateAsync(payload);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create KPI");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
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
            <h2 className="text-2xl font-bold font-display text-primary">Create KPI</h2>
            <p className="text-text-secondary mt-1">Add a new key performance indicator</p>
          </div>

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
                disabled={createKPI.isPending}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {createKPI.isPending ? "Creating..." : "Create KPI"}
              </button>
              <button
                type="button"
                onClick={onCancel}
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
