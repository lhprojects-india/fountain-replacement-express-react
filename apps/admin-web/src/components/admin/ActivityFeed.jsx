import { useEffect, useState } from "react";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@lh/shared";
import { adminServices } from "../../lib/admin-services";
import { useAdminAuth } from "../../context/AdminAuthContext";

function toLabel(stage) {
  return String(stage || "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toRelativeTime(value) {
  const d = new Date(value);
  const hours = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const ActivityFeed = ({ onOpenApplication }) => {
  const { currentUser } = useAdminAuth();
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const load = async (nextOffset = 0, append = false) => {
    setLoading(true);
    try {
      const actorEmail = filter === "mine" ? currentUser?.email : "";
      const result = await adminServices.getRecentActivity(20, nextOffset, { actorEmail });
      setItems((prev) => (append ? [...prev, ...(result.items || [])] : result.items || []));
      setOffset(nextOffset + 20);
      setHasMore(Boolean(result.pagination?.hasMore));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0, false);
  }, [filter, currentUser?.email]);

  useEffect(() => {
    const id = setInterval(() => load(0, false), 30000);
    return () => clearInterval(id);
  }, [filter, currentUser?.email]);

  return (
    <div className="w-[360px] shrink-0 adm-panel p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-sm">Recent Activity</h3>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="mine">My actions</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="adm-btn-outline" onClick={() => load(0, false)}>Refresh</Button>
        </div>
      </div>
      <div className="space-y-2 max-h-[70vh] overflow-auto">
        {items.map((item) => {
          const isRejected = item.toStage === "rejected";
          const isPositive = item.toStage === "approved" || item.toStage === "active";
          const dot = isRejected ? "bg-red-500" : isPositive ? "bg-green-500" : "bg-blue-500";
          return (
            <div key={item.id} className="rounded-md border border-slate-200 p-2 bg-white hover:bg-slate-50/60">
              <p className="text-sm">
                <span className={`inline-block h-2 w-2 rounded-full mr-2 ${dot}`} />
                <button type="button" className="font-medium hover:underline" onClick={() => onOpenApplication?.(item.applicationId)}>
                  {item.applicantName || item.applicantEmail || "Application"}
                </button>{" "}
                moved from {toLabel(item.fromStage)} {"->"} {toLabel(item.toStage)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                by {item.actorEmail || item.actorType || "system"} · {toRelativeTime(item.occurredAt)}
              </p>
              {item.reason ? <p className="text-xs text-gray-600 mt-1">Reason: {item.reason}</p> : null}
            </div>
          );
        })}
      </div>
      {hasMore ? (
        <Button className="w-full adm-btn-outline" variant="outline" onClick={() => load(offset, true)} disabled={loading}>
          {loading ? "Loading..." : "Load more"}
        </Button>
      ) : null}
    </div>
  );
};

export default ActivityFeed;
