import { useEffect, useState } from "react";
import { Button, useToast } from "@lh/shared";
import { adminServices } from "../../lib/admin-services";

export default function CommunicationsOverview() {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminServices.getCommunicationStats();
      setStats(data);
    } catch (error) {
      toast({
        title: "Failed to load communication stats",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const retryFailure = async (row) => {
    try {
      await adminServices.retryCommunicationLog(row.id);
      toast({ title: "Retry queued", description: `${row.channel.toUpperCase()} retry sent.` });
      await load();
    } catch (error) {
      toast({
        title: "Retry failed",
        description: error?.message || "Unable to retry this communication.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Communications</h3>
        <Button variant="outline" size="sm" className="adm-btn-outline" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
      {!stats ? (
        <p className="text-sm text-gray-500">{loading ? "Loading..." : "No data available."}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="adm-stat-card p-3">
              <p className="text-xs text-gray-500">Total Sent</p>
              <p className="text-2xl font-semibold">{stats.totalSent || 0}</p>
            </div>
            <div className="adm-stat-card p-3">
              <p className="text-xs text-gray-500">Email Sent</p>
              <p className="text-2xl font-semibold">{stats.byChannel?.email?.sent || 0}</p>
            </div>
            <div className="adm-stat-card p-3">
              <p className="text-xs text-gray-500">SMS Sent</p>
              <p className="text-2xl font-semibold">{stats.byChannel?.sms?.sent || 0}</p>
            </div>
            <div className="adm-stat-card p-3">
              <p className="text-xs text-gray-500">Delivery Rate</p>
              <p className="text-2xl font-semibold">{stats.deliveryRate || 0}%</p>
            </div>
          </div>

          <div className="adm-table-shell">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-3 py-2">Event</th>
                  <th className="text-left px-3 py-2">Sent</th>
                  <th className="text-left px-3 py-2">Delivered</th>
                  <th className="text-left px-3 py-2">Failed</th>
                  <th className="text-left px-3 py-2">Delivery Rate</th>
                </tr>
              </thead>
              <tbody>
                {(stats.byEvent || []).map((row) => (
                  <tr key={row.eventKey} className="border-b last:border-b-0 hover:bg-slate-50/70">
                    <td className="px-3 py-2">{row.eventKey}</td>
                    <td className="px-3 py-2">{row.sent}</td>
                    <td className="px-3 py-2">{row.delivered}</td>
                    <td className="px-3 py-2">{row.failed}</td>
                    <td className="px-3 py-2">{row.deliveryRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="adm-table-shell">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-3 py-2">Application</th>
                  <th className="text-left px-3 py-2">Channel</th>
                  <th className="text-left px-3 py-2">Error</th>
                  <th className="text-left px-3 py-2">Sent At</th>
                  <th className="text-right px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {(stats.recentFailures || []).length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-gray-500" colSpan={5}>
                      No recent failures.
                    </td>
                  </tr>
                ) : (
                  stats.recentFailures.map((row) => (
                    <tr key={row.id} className="border-b last:border-b-0 hover:bg-slate-50/70">
                      <td className="px-3 py-2">{row.applicationName || row.recipientEmail || row.recipientPhone || "-"}</td>
                      <td className="px-3 py-2">{row.channel}</td>
                      <td className="px-3 py-2">{row.error || "-"}</td>
                      <td className="px-3 py-2">
                        {row.sentAt ? new Date(row.sentAt).toLocaleString() : "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button size="sm" variant="outline" className="adm-btn-outline" onClick={() => retryFailure(row)}>
                          Retry
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
