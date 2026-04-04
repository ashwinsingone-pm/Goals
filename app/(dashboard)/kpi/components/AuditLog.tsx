"use client";

import { useLogs } from "@/lib/hooks/useKPI";
import { motion } from "framer-motion";

interface AuditLogProps {
  kpiId: string;
}

export function AuditLog({ kpiId }: AuditLogProps) {
  const { data: logs, isLoading } = useLogs(kpiId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-success/10 text-success";
      case "updated":
        return "bg-primary/10 text-primary";
      case "deleted":
        return "bg-danger/10 text-danger";
      default:
        return "bg-neutral-100 text-text-secondary";
    }
  };

  const getActionLabel = (action: string) => {
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-text-primary">Change History</h3>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {isLoading ? (
          <p className="text-text-secondary text-sm">Loading audit logs...</p>
        ) : !logs || logs.length === 0 ? (
          <p className="text-text-tertiary text-sm">No changes recorded yet</p>
        ) : (
          logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 border border-border rounded-lg"
            >
              <div className="flex items-start gap-3">
                {/* Action Badge */}
                <div className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${getActionColor(log.action)}`}>
                  {getActionLabel(log.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">
                    Changed by <span className="font-medium">{log.changedBy}</span>
                  </p>

                  {log.oldValue !== null && log.newValue !== null && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                      <span className="line-through text-danger">{log.oldValue}</span>
                      <span>→</span>
                      <span className="text-success font-medium">{log.newValue}</span>
                    </div>
                  )}

                  {log.reason && (
                    <p className="text-xs text-text-tertiary mt-1 italic">
                      Reason: {log.reason}
                    </p>
                  )}

                  <p className="text-xs text-text-tertiary mt-1">
                    {formatDate(log.createdAt)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
