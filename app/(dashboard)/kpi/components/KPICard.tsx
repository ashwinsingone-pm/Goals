"use client";

import { motion } from "framer-motion";
import { KPIResponse } from "@/lib/services/kpiService";
import { HealthStatusBadge } from "./HealthStatusBadge";

interface KPICardProps {
  kpi: KPIResponse;
  onClick?: () => void;
}

export function KPICard({ kpi, onClick }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white border border-border rounded-lg p-6 cursor-pointer hover:shadow-md transition-all"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-text-primary truncate">
            {kpi.name}
          </h3>
          {kpi.description && (
            <p className="text-sm text-text-secondary truncate mt-1">
              {kpi.description}
            </p>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-3 mb-4 text-xs text-text-tertiary">
        <span>Owner: {kpi.owner}</span>
        <span>•</span>
        <span>{kpi.quarter} {kpi.year}</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-secondary">Progress</span>
          <span className="text-sm font-bold text-primary">
            {kpi.progressPercent.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(kpi.progressPercent, 100)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-primary rounded-full h-2"
          />
        </div>
      </div>

      {/* Achievement */}
      <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
        <p className="text-xs text-text-secondary mb-1">Quarter-to-Date Achievement</p>
        <p className="text-base font-semibold text-text-primary">
          {kpi.qtdAchieved || 0} / {kpi.qtdGoal || 0}
          <span className="text-xs text-text-secondary ml-2">
            {kpi.measurementUnit === "Currency" ? "$" :
             kpi.measurementUnit === "Percentage" ? "%" : ""}
          </span>
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <HealthStatusBadge status={kpi.healthStatus} />
        <span className="text-xs text-text-tertiary">
          {new Date(kpi.createdAt).toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  );
}
