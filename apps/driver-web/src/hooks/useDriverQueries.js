import { useQuery, useQueryClient } from "@tanstack/react-query";
import { publicServices } from "../lib/public-services";
import { driverQueryKeys } from "../lib/query-keys";

export function useDriverApplication(options = {}) {
  return useQuery({
    queryKey: driverQueryKeys.application,
    queryFn: async () => {
      const result = await publicServices.getDriverApplication();
      return result?.application ?? null;
    },
    ...options,
  });
}

export function useDriverDocuments(options = {}) {
  return useQuery({
    queryKey: driverQueryKeys.documents,
    queryFn: () => publicServices.getDriverDocuments(),
    ...options,
  });
}

export function useInvalidateDriverQueries() {
  const queryClient = useQueryClient();
  return {
    invalidateApplication: () =>
      queryClient.invalidateQueries({ queryKey: driverQueryKeys.application }),
    invalidateDocuments: () =>
      queryClient.invalidateQueries({ queryKey: driverQueryKeys.documents }),
  };
}
