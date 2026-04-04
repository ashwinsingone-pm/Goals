"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const YEARS = ["2024-2025", "2025-2026", "2026-2027", "2027-2028", "2028-2029"];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

type Tab = "my" | "team";

/* ─── Section Card ─── */
function SectionCard({
  badge,
  badgeColor = "bg-blue-600",
  rightContent,
  children,
}: {
  badge: string;
  badgeColor?: string;
  rightContent?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Section header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className={cn("text-xs font-semibold text-white px-3 py-1 rounded", badgeColor)}>
          {badge}
        </span>
        {rightContent}
      </div>
      {/* Content */}
      <div className="px-4 py-8 flex items-center justify-center text-sm text-gray-500">
        {children}
      </div>
    </div>
  );
}

/* ─── Select Dropdown ─── */
function SelectDropdown({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("my");
  const [year, setYear] = useState("2027-2028");
  const [quarter, setQuarter] = useState("");
  const [wwwFilter, setWwwFilter] = useState("Not Applicable, Be...");

  return (
    <div className="p-6 max-w-6xl">
      {/* Page title */}
      <h1 className="text-xl font-bold text-gray-900 mb-5">Dashboard</h1>

      {/* Controls bar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        {/* Tabs */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
          <button
            onClick={() => setActiveTab("my")}
            className={cn(
              "px-5 py-2 text-sm font-medium transition-colors",
              activeTab === "my"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            My Dashboard
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={cn(
              "px-5 py-2 text-sm font-medium border-l border-gray-200 transition-colors",
              activeTab === "team"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Team
          </button>
        </div>

        {/* Year + Quarter selectors */}
        <div className="flex items-center gap-2">
          <SelectDropdown
            value={year}
            onChange={setYear}
            options={YEARS}
          />
          <SelectDropdown
            value={quarter}
            onChange={setQuarter}
            options={QUARTERS}
            placeholder="Select Quarter"
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {/* KPI Section */}
        <SectionCard badge="KPI">
          No Data Found
        </SectionCard>

        {/* Priority Section */}
        <SectionCard badge="Priority">
          No Data Found
        </SectionCard>

        {/* WWW Section */}
        <SectionCard
          badge="WWW"
          rightContent={
            <SelectDropdown
              value={wwwFilter}
              onChange={setWwwFilter}
              options={["Not Applicable, Be...", "Applicable", "All"]}
              className="text-xs"
            />
          }
        >
          No Data Found
        </SectionCard>
      </div>
    </div>
  );
}
