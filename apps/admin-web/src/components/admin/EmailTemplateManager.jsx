import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  useToast,
} from "@lh/shared";
import { adminServices } from "../../lib/admin-services";

const DEFAULT_VARIABLES = {
  firstName: "Alex",
  lastName: "Driver",
  fullName: "Alex Driver",
  email: "alex.driver@example.com",
  jobTitle: "Driver",
  cityName: "London",
  currentStage: "screening",
  stageLabelHuman: "Screening",
  dashboardUrl: "https://driver.example.com/dashboard",
  companyName: "Talentrix by Laundryheap",
  logoUrl: "https://images.ctfassets.net/whz1awz2x4s7/4X0fR5B3hATQCy5X2wS0pM/3fdd9eefeb6f5e145470f79f87edace6/laundryheap_logo_white.png",
  companyAddress: "6th Floor, 2 Kingdom Street, London, W2 6BD",
  unsubscribeUrl: "https://www.laundryheap.com/unsubscribe",
  supportUrl: "https://www.laundryheap.com/contact",
  firstBlockDate: "2026-04-10T08:00:00.000Z",
  firstBlockDateHuman: "Friday, 10 April 2026 at 9:00 AM",
  code: "123456",
};

const VARIABLE_KEYS = Object.keys(DEFAULT_VARIABLES);

const EMPTY_FORM = {
  eventKey: "",
  channel: "email",
  locale: "en",
  subject: "",
  body: "",
  isActive: true,
};

export default function EmailTemplateManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState({ subject: "", body: "" });
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [tokenQuery, setTokenQuery] = useState("");

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const rows = await adminServices.getEmailTemplates();
      setTemplates(rows || []);
    } catch (error) {
      toast({
        title: "Failed to load templates",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const sortedTemplates = useMemo(
    () =>
      [...templates].sort(
        (a, b) =>
          String(a.eventKey || "").localeCompare(String(b.eventKey || "")) ||
          String(a.channel || "").localeCompare(String(b.channel || ""))
      ),
    [templates]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPreview({ subject: "", body: "" });
    setTestRecipient("");
    setDialogOpen(true);
  };

  const openEdit = (template) => {
    setEditingId(template.id);
    setForm({
      eventKey: template.eventKey || "",
      channel: template.channel || "email",
      locale: template.locale || "en",
      subject: template.subject || "",
      body: template.body || "",
      isActive: Boolean(template.isActive),
    });
    setPreview({ subject: "", body: "" });
    setTestRecipient("");
    setDialogOpen(true);
  };

  const handleInsertToken = (token) => {
    setForm((prev) => ({ ...prev, body: `${prev.body}{{${token}}}` }));
  };

  const filteredTokens = useMemo(() => {
    const q = tokenQuery.trim().toLowerCase();
    if (!q) return VARIABLE_KEYS;
    return VARIABLE_KEYS.filter((k) => k.toLowerCase().includes(q));
  }, [tokenQuery]);

  const handlePreview = async () => {
    if (!editingId) {
      const render = (source) =>
        String(source || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) =>
          DEFAULT_VARIABLES[key] == null ? "" : String(DEFAULT_VARIABLES[key])
        );
      const localBody = render(form.body);
      const localLayout = `
<!DOCTYPE html>
<html><body style="margin:0;padding:20px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:10px;">
      <tr><td style="background:#00B4D8;padding:18px;text-align:center;color:#fff;"><div style="font-size:20px;font-weight:700;line-height:1.2;">Talentrix</div><div style="font-size:13px;font-weight:500;opacity:0.92;margin-top:4px;">by Laundryheap</div></td></tr>
      <tr><td style="padding:24px;">${localBody}</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
      setPreview({
        subject: render(form.subject),
        body: localLayout,
      });
      return;
    }
    setPreviewing(true);
    try {
      const rendered = await adminServices.previewEmailTemplate(editingId, DEFAULT_VARIABLES);
      setPreview({
        subject: rendered?.subject || "",
        body: rendered?.body || "",
      });
    } catch (error) {
      toast({
        title: "Preview failed",
        description: error?.message || "Unable to render preview.",
        variant: "destructive",
      });
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await adminServices.updateEmailTemplate(editingId, form);
      } else {
        await adminServices.createEmailTemplate(form);
      }
      setDialogOpen(false);
      await loadTemplates();
      toast({ title: "Template saved" });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error?.message || "Unable to save template.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async () => {
    if (!editingId) {
      toast({
        title: "Save template first",
        description: "Test send requires a saved template.",
        variant: "destructive",
      });
      return;
    }
    if (!testRecipient.trim()) {
      toast({
        title: "Recipient required",
        description: "Enter a test email or phone number.",
        variant: "destructive",
      });
      return;
    }
    setSendingTest(true);
    try {
      const result = await adminServices.testSendTemplate(
        editingId,
        testRecipient.trim(),
        DEFAULT_VARIABLES
      );
      toast({
        title: "Test send complete",
        description: `Status: ${result?.status || "unknown"}`,
      });
    } catch (error) {
      toast({
        title: "Test send failed",
        description: error?.message || "Unable to send test notification.",
        variant: "destructive",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      await adminServices.deleteEmailTemplate(id);
      await loadTemplates();
      toast({ title: "Template deleted" });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error?.message || "Unable to delete template.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Templates</h3>
          <p className="text-sm text-gray-500">
            Manage event-based templates used by workflow transitions and driver auth.
          </p>
        </div>
        <Button onClick={openCreate} className="adm-btn-primary">New Template</Button>
      </div>

      <div className="adm-table-shell">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-3 py-2">Event Key</th>
              <th className="text-left px-3 py-2">Channel</th>
              <th className="text-left px-3 py-2">Subject</th>
              <th className="text-left px-3 py-2">Active</th>
              <th className="text-left px-3 py-2">Last Updated</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={6}>
                  Loading templates...
                </td>
              </tr>
            ) : sortedTemplates.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={6}>
                  No templates found.
                </td>
              </tr>
            ) : (
              sortedTemplates.map((template) => (
                <tr key={template.id} className="border-b last:border-b-0 hover:bg-slate-50/70">
                  <td className="px-3 py-2 font-medium">{template.eventKey}</td>
                  <td className="px-3 py-2">{template.channel}</td>
                  <td className="px-3 py-2 max-w-[360px] truncate">{template.subject || "-"}</td>
                  <td className="px-3 py-2">{template.isActive ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">
                    {template.updatedAt ? new Date(template.updatedAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <Button size="sm" variant="outline" className="adm-btn-outline" onClick={() => openEdit(template)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="adm-btn-outline text-red-600"
                      onClick={() => handleDelete(template.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="adm-modal max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Email Template" : "Create Email Template"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Input
                value={form.eventKey}
                onChange={(e) => setForm((prev) => ({ ...prev, eventKey: e.target.value }))}
                placeholder="Event key (e.g. stage.screening)"
              />

              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={form.channel}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, channel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">email</SelectItem>
                    <SelectItem value="sms">sms</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={form.locale}
                  onChange={(e) => setForm((prev) => ({ ...prev, locale: e.target.value }))}
                  placeholder="Locale"
                />
                <label className="flex items-center justify-center gap-2 text-sm border rounded-md">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                  />
                  Active
                </label>
              </div>

              <Input
                value={form.subject}
                onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Subject (supports {{variable}})"
              />

              <Textarea
                value={form.body}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                placeholder="Template body (supports {{variable}})"
                rows={12}
                className="font-mono text-xs"
              />

              <div className="space-y-2">
                <Input
                  value={tokenQuery}
                  onChange={(e) => setTokenQuery(e.target.value)}
                  placeholder="Find variable (type after {{ )"
                />
                <div className="flex flex-wrap gap-2">
                  {filteredTokens.map((token) => (
                  <button
                    key={token}
                    type="button"
                    className="rounded-full border border-slate-200 px-2 py-1 text-xs hover:bg-gray-50"
                    onClick={() => handleInsertToken(token)}
                  >
                    {`{{${token}}}`}
                  </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Preview</h4>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="adm-btn-outline"
                    onClick={() => setMobilePreview((prev) => !prev)}
                  >
                    {mobilePreview ? "Desktop" : "Mobile"}
                  </Button>
                  <Button size="sm" variant="outline" className="adm-btn-outline" onClick={handlePreview} disabled={previewing}>
                    {previewing ? "Rendering..." : "Preview"}
                  </Button>
                  <Button size="sm" variant="outline" className="adm-btn-outline" onClick={handleTestSend} disabled={sendingTest}>
                    {sendingTest ? "Sending..." : "Send Test"}
                  </Button>
                </div>
              </div>
              <Input
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="Test recipient (email or +phone)"
              />
              <div className="rounded-md border border-slate-200 p-3 bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">Subject</p>
                <p className="font-medium">{preview.subject || "No preview yet"}</p>
              </div>
              <div className="rounded-md border border-slate-200 p-3 min-h-[260px]">
                <p className="text-xs text-gray-500 mb-2">Rendered Body</p>
                {preview.body ? (
                    <div className="overflow-auto rounded border border-slate-200 bg-gray-50 p-2">
                    <div
                      className="mx-auto bg-white shadow-sm"
                      style={{ width: mobilePreview ? 375 : "100%", maxWidth: "100%" }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: preview.body }} />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Click Preview to render with sample data.</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="adm-btn-outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
