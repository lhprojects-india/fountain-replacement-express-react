/** @param {URLSearchParams} searchParams */
export function parsePipelineSearchParams(searchParams, initialFilters) {
  const view = searchParams.get("view");
  const q = searchParams.get("q") || "";
  const city = searchParams.get("city");
  const job = searchParams.get("job");
  const page = Number(searchParams.get("page") || "1");
  const overdueOnly = searchParams.get("overdue") === "1";
  const stages = searchParams.get("stages")?.split(",").filter(Boolean) || [];
  const vehicles = searchParams.get("vehicles")?.split(",").filter(Boolean) || [];
  const contract = searchParams.get("contract")?.split(",").filter(Boolean) || [];

  return {
    view: view === "kanban" || view === "table" ? view : null,
    searchInput: q,
    filters: {
      ...initialFilters,
      search: q,
      cityIds: city ? [city] : [],
      jobIds: job ? [job] : [],
      stages,
      vehicleTypes: vehicles,
      contractStatus: contract,
      overdueOnly,
      page: Number.isFinite(page) && page > 0 ? page : 1,
    },
  };
}

export function serializePipelineSearchParams({ view, searchInput, filters }) {
  const params = new URLSearchParams();
  if (view && view !== "table") params.set("view", view);
  const q = (searchInput || filters.search || "").trim();
  if (q) params.set("q", q);
  if (filters.cityIds?.[0]) params.set("city", String(filters.cityIds[0]));
  if (filters.jobIds?.[0]) params.set("job", String(filters.jobIds[0]));
  if (filters.page && filters.page !== 1) params.set("page", String(filters.page));
  if (filters.overdueOnly) params.set("overdue", "1");
  if (filters.stages?.length) params.set("stages", filters.stages.join(","));
  if (filters.vehicleTypes?.length) params.set("vehicles", filters.vehicleTypes.join(","));
  if (filters.contractStatus?.length) params.set("contract", filters.contractStatus.join(","));
  return params;
}
