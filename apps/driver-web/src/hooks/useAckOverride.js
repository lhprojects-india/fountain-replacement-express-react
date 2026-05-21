import { useState } from "react";

/** Local checkbox override with server-derived default (no useEffect sync). */
export function useAckOverride(serverAcknowledged) {
  const [override, setOverride] = useState(null);
  const acknowledged = override ?? Boolean(serverAcknowledged);
  const setAcknowledged = (value) => setOverride(Boolean(value));
  return [acknowledged, setAcknowledged];
}
