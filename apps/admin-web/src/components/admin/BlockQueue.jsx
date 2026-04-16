import { useEffect, useState } from "react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from "@lh/shared";
import { adminServices } from "../../lib/admin-services";

function rowAccent(status) {
  if (status === "today") return "bg-sky-50 border-l-4 border-l-sky-500";
  if (status === "past_due") return "bg-amber-50 border-l-4 border-l-amber-600";
  if (status === "unscheduled") return "bg-gray-50 border-l-4 border-l-gray-300";
  return "";
}

function statusLabel(status) {
  if (status === "today") return "Today";
  if (status === "past_due") return "Past due";
  if (status === "unscheduled") return "Unscheduled";
  return "Upcoming";
}

const BlockQueue = ({ onOpenApplication }) => {
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState({ all: [], upcoming: [], today: [], pastDue: [], unscheduled: [] });
  const [passTarget, setPassTarget] = useState(null);
  const [failTarget, setFailTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [blockAt, setBlockAt] = useState("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const result = await adminServices.getBlockQueue();
      setQueue(result || { all: [], upcoming: [], today: [], pastDue: [], unscheduled: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = queue.all || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {loading ? "Loading first-block queue..." : `${rows.length} first block${rows.length === 1 ? "" : "s"} scheduled`}
        </p>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>
      <div className="rounded border bg-white overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Block date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-8">
                  No applications in first block assigned stage.
                </TableCell>
              </TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id} className={rowAccent(row.blockStatus)}>
                <TableCell className="font-medium">{row.name || row.email}</TableCell>
                <TableCell>{row.city || "-"}</TableCell>
                <TableCell>{row.vehicleType || "-"}</TableCell>
                <TableCell>
                  {row.firstBlockDate ? new Date(row.firstBlockDate).toLocaleString() : "—"}
                </TableCell>
                <TableCell>{statusLabel(row.blockStatus)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => onOpenApplication?.(row.id)}>Open</Button>
                    <Button size="sm" variant="outline" className="text-green-800 border-green-300" onClick={() => { setPassTarget(row); setNotes(""); }}>
                      Pass
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-800 border-red-300" onClick={() => { setFailTarget(row); setNotes(""); }}>
                      Fail
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setRescheduleTarget(row); setBlockAt(""); setReason(""); }}>
                      Reschedule
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(passTarget)} onOpenChange={() => setPassTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark first block passed?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">
            This will activate the driver and send the welcome notification (if configured).
          </p>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPassTarget(null)}>Cancel</Button>
            <Button
              className="bg-green-700 hover:bg-green-800"
              onClick={async () => {
                await adminServices.recordFirstBlockResult(passTarget.id, "passed", notes);
                setPassTarget(null);
                await load();
              }}
            >
              Confirm pass
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(failTarget)} onOpenChange={() => setFailTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark first block failed?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">
            The application will be rejected with reason &quot;failed first block&quot;.
          </p>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFailTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await adminServices.recordFirstBlockResult(failTarget.id, "failed", notes);
                setFailTarget(null);
                await load();
              }}
            >
              Confirm fail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(rescheduleTarget)} onOpenChange={() => setRescheduleTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reschedule first block</DialogTitle></DialogHeader>
          <Input type="datetime-local" value={blockAt} onChange={(e) => setBlockAt(e.target.value)} />
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleTarget(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                await adminServices.rescheduleFirstBlock(rescheduleTarget.id, new Date(blockAt).toISOString(), reason);
                setRescheduleTarget(null);
                await load();
              }}
              disabled={!blockAt}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlockQueue;
