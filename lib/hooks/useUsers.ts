"use client";

import { useQuery } from "@tanstack/react-query";
import type { User } from "@/lib/types/kpi";

async function fetchUsers(): Promise<User[]> {
  const res = await fetch("/api/users");
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to fetch users");
  return data.data;
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 1000 * 60 * 5,
  });
}
