import { useEffect, useState } from "react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from "@lh/shared";
import { adminServices } from "../../lib/admin-services";

const CallQueue = ({ onOpenApplication }) => {
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState({ scheduled: [], unscheduled: [], all: [] });
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [noShowTarget, setNoShowTarget] = useState(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [noShowAction, setNoShowAction] = useState("none");

  const load = async () => {
    setLoading(true);
    try {
      const result = await adminServices.getCallQueue();
      setQueue(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = [...(queue.scheduled || []), ...(queue.unscheduled || [])];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {loading ? "Loading call queue..." : `${rows.length} onboarding calls pending`}
        </p>
        <Button variant="outline" className="adm-btn-outline" onClick={load}>Refresh</Button>
      </div>
      <div className="adm-table-shell">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-8">
                  No onboarding calls in queue.
                </TableCell>
              </TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-slate-50/70">
                <TableCell className="font-medium">{row.name || row.email}</TableCell>
                <TableCell>{row.phone || "-"}</TableCell>
                <TableCell>{row.city || "-"}</TableCell>
                <TableCell>{row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : "-"}</TableCell>
                <TableCell>{row.scheduledAt ? "Scheduled" : "Unscheduled"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="adm-btn-outline" onClick={() => onOpenApplication?.(row.id)}>Open</Button>
                    {!row.scheduledAt ? (
                      <Button size="sm" variant="outline" className="adm-btn-outline" onClick={() => { setScheduleTarget(row); setScheduledAt(""); }}>
                        Schedule
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" className="adm-btn-outline" onClick={() => { setCompleteTarget(row); setNotes(""); }}>
                          Complete
                        </Button>
                        <Button size="sm" variant="outline" className="adm-btn-outline" onClick={() => { setRescheduleTarget(row); setScheduledAt(""); setReason(""); }}>
                          Reschedule
                        </Button>
                        <Button size="sm" variant="outline" className="adm-btn-outline" onClick={() => { setNoShowTarget(row); setReason(""); setNoShowAction("none"); setScheduledAt(""); }}>
                          No Show
                        </Button>
                      </>
                    )}
                  </div>
                  {row.noShowCount ? (
                    <div className="text-xs text-amber-700 mt-1">
                      No-shows: {row.noShowCount}
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(scheduleTarget)} onOpenChange={() => setScheduleTarget(null)}>
        <DialogContent className="adm-modal">
          <DialogHeader><DialogTitle>Schedule onboarding call</DialogTitle></DialogHeader>
          <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleTarget(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                await adminServices.scheduleOnboardingCall(scheduleTarget.id, new Date(scheduledAt).toISOString());
                setScheduleTarget(null);
                await load();
              }}
              disabled={!scheduledAt}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(completeTarget)} onOpenChange={() => setCompleteTarget(null)}>
        <DialogContent className="adm-modal">
          <DialogHeader><DialogTitle>Complete onboarding call</DialogTitle></DialogHeader>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Call notes" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteTarget(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                await adminServices.completeOnboardingCall(completeTarget.id, notes);
                setCompleteTarget(null);
                await load();
              }}
            >
              Complete Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(rescheduleTarget)} onOpenChange={() => setRescheduleTarget(null)}>
        <DialogContent className="adm-modal">
          <DialogHeader><DialogTitle>Reschedule onboarding call</DialogTitle></DialogHeader>
          <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleTarget(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                await adminServices.rescheduleOnboardingCall(rescheduleTarget.id, new Date(scheduledAt).toISOString(), reason);
                setRescheduleTarget(null);
                await load();
              }}
              disabled={!scheduledAt}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(noShowTarget)} onOpenChange={() => setNoShowTarget(null)}>
        <DialogContent className="adm-modal">
          <DialogHeader><DialogTitle>Mark call as no-show</DialogTitle></DialogHeader>
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={noShowAction}
            onChange={(e) => setNoShowAction(e.target.value)}
          >
            <option value="none">Mark no-show only</option>
            <option value="reschedule">Reschedule call</option>
            <option value="reject">Reject application</option>
          </select>
          {noShowAction === "reschedule" ? (
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          ) : null}
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoShowTarget(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                await adminServices.markOnboardingCallNoShow(noShowTarget.id, {
                  action: noShowAction,
                  scheduledAt: noShowAction === "reschedule" && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
                  reason,
                });
                setNoShowTarget(null);
                await load();
              }}
              disabled={noShowAction === "reschedule" && !scheduledAt}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CallQueue;
