"use client";

interface HealthStatusBadgeProps {
  status: string;
}

export function HealthStatusBadge({ status }: HealthStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track":
        return "bg-success/10 text-success border border-success/20";
      case "behind-schedule":
        return "bg-warning/10 text-warning border border-warning/20";
      case "critical":
        return "bg-danger/10 text-danger border border-danger/20";
      case "complete":
        return "bg-primary/10 text-primary border border-primary/20";
      default:
        return "bg-neutral-100 text-text-secondary border border-neutral-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "on-track":
        return "On Track";
      case "behind-schedule":
        return "Behind Schedule";
      case "critical":
        return "Critical";
      case "complete":
        return "Complete";
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
        status
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
