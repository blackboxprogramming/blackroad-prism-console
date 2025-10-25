import { useQuery } from "@tanstack/react-query";
import { getAgents } from "@/lib/api";
import type { AgentRecord } from "@/types/dashboard";

export function useAgents() {
  return useQuery<AgentRecord[]>({
    queryKey: ["agents"],
    queryFn: getAgents,
    refetchInterval: 60_000,
    staleTime: 60_000
  });
}
