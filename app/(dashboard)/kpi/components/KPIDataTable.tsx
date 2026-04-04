"use client";

import { KPIResponse } from "@/lib/services/kpiService";
import { KPIListParams } from "@/lib/schemas/kpiSchema";
import { HealthStatusBadge } from "./HealthStatusBadge";
import { KPIDetailModal } from "./KPIDetailModal";
import { useState } from "react";

interface KPIDataTableProps {
  data: KPIResponse[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: Partial<KPIListParams>) => void;
  onDeleteKPI: (id: string) => void;
  filters: Partial<KPIListParams>;
}

export function KPIDataTable({
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onFilterChange,
  onDeleteKPI,
  filters,
}: KPIDataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKPIId, setSelectedKPIId] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onFilterChange({ search: searchQuery });
  };

  const totalPages = Math.ceil(total / pageSize);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Search KPIs by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                KPI Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                Created
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-secondary">
                  No KPIs found. Create one to get started!
                </td>
              </tr>
            ) : (
              data.map((kpi) => (
                <tr key={kpi.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-text-primary">
                    <div>
                      <p className="font-medium">{kpi.name}</p>
                      {kpi.description && (
                        <p className="text-xs text-text-secondary truncate">
                          {kpi.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{kpi.owner}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-neutral-200 rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${Math.min(kpi.progressPercent, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-text-secondary">
                          {kpi.progressPercent.toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {kpi.qtdAchieved || 0} / {kpi.qtdGoal || 0}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <HealthStatusBadge status={kpi.healthStatus} />
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {formatDate(kpi.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedKPIId(kpi.id)}
                        className="text-primary hover:underline text-xs font-medium"
                        title="View details"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onDeleteKPI(kpi.id)}
                        className="text-danger hover:underline text-xs font-medium"
                        title="Delete KPI"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of{" "}
            {total} KPIs
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50 hover:bg-neutral-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 rounded text-sm ${
                  page === pageNum
                    ? "bg-primary text-white"
                    : "border border-border hover:bg-neutral-50"
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50 hover:bg-neutral-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedKPIId && (
        <KPIDetailModal
          kpiId={selectedKPIId}
          onClose={() => setSelectedKPIId(null)}
        />
      )}
    </div>
  );
}
