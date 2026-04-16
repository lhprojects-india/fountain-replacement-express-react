import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
  useToast,
} from "@lh/shared";
import { adminServices } from "../../lib/admin-services";

const EVENT_LABELS = {
  "application.received": "Application Received",
  "stage.screening": "Moved to Screening",
  "stage.contract_sent": "Contract Sent",
  "stage.documents_pending": "Documents Needed",
  "stage.approved": "Approved",
  "stage.rejected": "Rejected",
  "auth.verification_code": "Verification Code",
};

const DEFAULT_EVENTS = Object.keys(EVENT_LABELS);

const emptyEditor = {
  id: null,
  eventKey: "",
  channel: "email",
  subject: "",
  body: "",
  isActive: true,
};

export default function NotificationSettingsManager() {
  const { toast } = useToast();
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editor, setEditor] = useState(emptyEditor);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await adminServices.getNotificationMatrix();
      setMatrix(rows || []);
    } catch (error) {
      toast({
        title: "Failed to load notification settings",
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

  const byEvent = Object.fromEntries(matrix.map((row) => [row.eventKey, row]));

  const openCreate = (eventKey, channel) => {
    setEditor({
      ...emptyEditor,
      eventKey,
      channel,
      body:
        channel === "sms"
          ? `Hi {{firstName}}, update for ${eventKey}: {{dashboardUrl}}`
          : "<p>Hi {{firstName}},</p><p>Your update is ready.</p>",
    });
    setEditorOpen(true);
  };

  const openEdit = (template) => {
    setEditor({
      id: template.id,
      eventKey: template.eventKey,
      channel: template.channel,
      subject: template.subject || "",
      body: template.body || "",
      isActive: Boolean(template.isActive),
    });
    setEditorOpen(true);
  };

  const saveEditor = async () => {
    try {
      if (editor.id) {
        await adminServices.updateEmailTemplate(editor.id, editor);
      } else {
        await adminServices.createEmailTemplate(editor);
      }
      setEditorOpen(false);
      await load();
      toast({ title: "Notification template saved" });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error?.message || "Could not save notification template.",
        variant: "destructive",
      });
    }
  };

  const toggleTemplate = async (template) => {
    if (!template?.id) return;
    try {
      await adminServices.updateEmailTemplate(template.id, {
        ...template,
        isActive: !template.isActive,
      });
      await load();
    } catch (error) {
      toast({
        title: "Toggle failed",
        description: error?.message || "Could not update status.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Notifications</h3>
      <p className="text-sm text-gray-500">
        Configure which event notifications are active for email and SMS.
      </p>
      <div className="adm-table-shell">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-3 py-2">Event</th>
              <th className="text-left px-3 py-2">Email</th>
              <th className="text-left px-3 py-2">SMS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={3}>
                  Loading...
                </td>
              </tr>
            ) : (
              DEFAULT_EVENTS.map((eventKey) => {
                const row = byEvent[eventKey] || { eventKey, email: null, sms: null };
                return (
                  <tr key={eventKey} className="border-b last:border-b-0 hover:bg-slate-50/70">
                    <td className="px-3 py-2">{EVENT_LABELS[eventKey] || eventKey}</td>
                    {["email", "sms"].map((channel) => {
                      const tpl = row[channel];
                      return (
                        <td key={`${eventKey}-${channel}`} className="px-3 py-2">
                          {tpl ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={Boolean(tpl.isActive)}
                                onChange={() => toggleTemplate(tpl)}
                              />
                              <Button size="sm" variant="outline" className="adm-btn-outline" onClick={() => openEdit(tpl)}>
                                Edit
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                                className="adm-btn-outline"
                              onClick={() => openCreate(eventKey, channel)}
                            >
                              Add
                            </Button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="adm-modal max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editor.id ? "Edit Template" : "Add Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={editor.eventKey} disabled />
            <Input value={editor.channel} disabled />
            <Input
              value={editor.subject}
              onChange={(e) => setEditor((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="Subject (email only)"
              disabled={editor.channel === "sms"}
            />
            <Textarea
              rows={8}
              value={editor.body}
              onChange={(e) => setEditor((prev) => ({ ...prev, body: e.target.value }))}
              placeholder="Template body"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="adm-btn-outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditor}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
