import { useEffect, useState } from "react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Textarea } from "@lh/shared";
import { adminServices } from "../../lib/admin-services";

const AdminNotesDialog = ({ open, onClose, application, onSaved }) => {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setNotes(application?.adminNotes || "");
    setError("");
  }, [open, application]);

  const onSave = async () => {
    setSaving(true);
    setError("");
    try {
      await adminServices.updateApplicationNotes(application.id, notes);
      onSaved?.();
      onClose?.();
    } catch (e) {
      setError(e?.message || "Failed to save notes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Admin Notes</DialogTitle>
        </DialogHeader>
        <Textarea
          rows={8}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add internal notes for this application..."
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminNotesDialog;
