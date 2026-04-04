"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useKPIs, useCreateKPI, useDeleteKPI } from "@/lib/hooks/useKPI";
import { KPIDataTable } from "./components/KPIDataTable";
import { KPICreateForm } from "./components/KPICreateForm";
import { KPIListParams } from "@/lib/schemas/kpiSchema";

export const dynamic = "force-dynamic";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function KPIPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState<Partial<KPIListParams>>({
    page: 1,
    pageSize: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data, isLoading, error } = useKPIs(filters);
  const createKPI = useCreateKPI();
  const deleteKPI = useDeleteKPI();

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
  };

  const handleDeleteKPI = (id: string) => {
    if (confirm("Are you sure you want to delete this KPI?")) {
      deleteKPI.mutate(id);
    }
  };

  const handleFilterChange = (newFilters: Partial<KPIListParams>) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-8 space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-2">
        <h1 className="text-4xl font-bold font-display text-primary">KPI Tracking</h1>
        <p className="text-text-secondary">
          Manage and track key performance indicators across your organization
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div variants={itemVariants} className="flex gap-4">
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          Create KPI
        </button>
      </motion.div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <KPICreateForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Content */}
      <motion.div variants={itemVariants}>
        {isLoading ? (
          <div className="bg-white border border-border rounded-lg p-8 text-center">
            <p className="text-text-secondary">Loading KPIs...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-danger rounded-lg p-8 text-center">
            <p className="text-danger">Failed to load KPIs</p>
          </div>
        ) : (
          <KPIDataTable
            data={data?.data || []}
            total={data?.total || 0}
            page={filters.page || 1}
            pageSize={filters.pageSize || 20}
            onPageChange={handlePageChange}
            onFilterChange={handleFilterChange}
            onDeleteKPI={handleDeleteKPI}
            filters={filters}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
