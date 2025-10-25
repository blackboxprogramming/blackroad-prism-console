import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/lib/api";
import type { DashboardOverview } from "@/types/dashboard";

export function useDashboard() {
  return useQuery<DashboardOverview>({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    staleTime: 30_000,
    refetchInterval: 30_000
  });
}
