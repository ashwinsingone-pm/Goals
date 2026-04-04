"use client";

import { useState, useRef, useEffect } from "react";
import { useUpdateWeeklyValue } from "@/lib/hooks/useKPI";
import { motion } from "framer-motion";

interface WeeklyValueFormProps {
  kpiId: string;
  currentWeek: number;
  initialValue?: number;
  measurementUnit: string;
}

export function WeeklyValueForm({
  kpiId,
  currentWeek,
  initialValue = 0,
  measurementUnit,
}: WeeklyValueFormProps) {
  const [value, setValue] = useState(initialValue.toString());
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateWeeklyValue = useUpdateWeeklyValue(kpiId);

  // Auto-save on value change with debounce
  useEffect(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Don't save empty values
    if (!value) {
      setSaveStatus("idle");
      return;
    }

    setSaveStatus("saving");

    // Set new debounce timeout
    debounceTimeoutRef.current = setTimeout(() => {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        setSaveStatus("error");
        return;
      }

      updateWeeklyValue.mutate(
        {
          weekNumber: currentWeek,
          value: numValue,
        },
        {
          onSuccess: () => {
            setSaveStatus("saved");
            // Reset to idle after 2 seconds
            setTimeout(() => setSaveStatus("idle"), 2000);
          },
          onError: () => {
            setSaveStatus("error");
          },
        }
      );
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [value, kpiId, currentWeek, updateWeeklyValue]);

  const getStatusIcon = () => {
    switch (saveStatus) {
      case "saving":
        return <span className="animate-spin">⏳</span>;
      case "saved":
        return <span className="text-success">✓</span>;
      case "error":
        return <span className="text-danger">✕</span>;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (saveStatus) {
      case "saving":
        return "Saving...";
      case "saved":
        return "Saved";
      case "error":
        return "Error saving";
      default:
        return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <label className="block text-sm font-medium text-text-primary">
        Week {currentWeek} Value
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter value..."
            step="0.01"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {saveStatus !== "idle" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium flex items-center gap-1"
            >
              {getStatusIcon()}
              <span className={`${
                saveStatus === "saved" ? "text-success" :
                saveStatus === "error" ? "text-danger" :
                "text-text-secondary"
              }`}>
                {getStatusText()}
              </span>
            </motion.div>
          )}
        </div>
        <span className="text-sm text-text-secondary font-medium whitespace-nowrap">
          {measurementUnit === "Currency" ? "$" :
           measurementUnit === "Percentage" ? "%" : ""}
        </span>
      </div>
      <p className="text-xs text-text-tertiary">
        Auto-saves as you type
      </p>
    </motion.div>
  );
}
