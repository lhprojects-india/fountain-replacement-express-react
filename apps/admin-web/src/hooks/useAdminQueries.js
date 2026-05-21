import { useQuery } from "@tanstack/react-query";
import { adminServices } from "../lib/admin-services";
import { adminQueryKeys } from "../lib/query-keys";

export function useApplicationStats(options = {}) {
  return useQuery({
    queryKey: adminQueryKeys.applicationStats,
    queryFn: () => adminServices.getApplicationStats(),
    staleTime: 30_000,
    ...options,
  });
}
