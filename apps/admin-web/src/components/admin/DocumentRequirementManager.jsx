import { useEffect, useMemo, useState } from "react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useToast } from "@lh/shared";
import { Edit, Plus, Trash2 } from "lucide-react";
import { adminServices } from "../../lib/admin-services";

const FILE_TYPE_OPTIONS = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "video/mp4",
  "video/webm",
];

const defaultForm = {
  name: "",
  code: "",
  fileTypes: [],
  isRequired: true,
  maxSizeMb: 10,
  maxDurationSec: "",
  sortOrder: 0,
};

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const DocumentRequirementManager = ({ cityId, regionId }) => {
  const effectiveCityId = cityId ?? regionId;
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const load = async () => {
    if (!effectiveCityId) return;
    const list = await adminServices.getDocumentRequirements(effectiveCityId);
    setRows(list);
  };

  useEffect(() => {
    load();
  }, [effectiveCityId]);

  const hasVideo = useMemo(
    () => form.fileTypes.some((t) => t.startsWith("video/")),
    [form.fileTypes]
  );

  const toggleFileType = (fileType) => {
    setForm((prev) => ({
      ...prev,
      fileTypes: prev.fileTypes.includes(fileType)
        ? prev.fileTypes.filter((t) => t !== fileType)
        : [...prev.fileTypes, fileType],
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || "",
      code: row.code || "",
      fileTypes: (row.fileTypes || "").split(",").filter(Boolean),
      isRequired: Boolean(row.isRequired),
      maxSizeMb: row.maxSizeMb ?? 10,
      maxDurationSec: row.maxDurationSec ?? "",
      sortOrder: row.sortOrder ?? 0,
    });
    setOpen(true);
  };

  const save = async () => {
    const payload = {
      cityId: effectiveCityId,
      name: form.name.trim(),
      code: (form.code || slugify(form.name)).trim(),
      fileTypes: form.fileTypes.join(","),
      isRequired: Boolean(form.isRequired),
      maxSizeMb: Number(form.maxSizeMb),
      maxDurationSec: hasVideo && form.maxDurationSec !== "" ? Number(form.maxDurationSec) : null,
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (editing) {
        await adminServices.updateDocumentRequirement(editing.id, payload);
        toast({ title: "Requirement updated" });
      } else {
        await adminServices.createDocumentRequirement(payload);
        toast({ title: "Requirement created" });
      }
      setOpen(false);
      await load();
    } catch (e) {
      toast({ title: "Save failed", description: e?.message || "Could not save requirement", variant: "destructive" });
    }
  };

  const remove = async (id) => {
    try {
      await adminServices.deleteDocumentRequirement(id);
      toast({ title: "Requirement deleted" });
      await load();
    } catch (e) {
      toast({ title: "Delete failed", description: e?.message || "Could not delete requirement", variant: "destructive" });
    }
  };

  const seedDefaults = async () => {
    try {
      const result = await adminServices.seedDocumentDefaults(effectiveCityId);
      toast({ title: "Defaults seeded", description: `${result.created || 0} added` });
      await load();
    } catch (e) {
      toast({ title: "Seed failed", description: e?.message || "Could not seed defaults", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-800">Document Requirements</h4>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={seedDefaults}>
            Seed Defaults
          </Button>
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Requirement
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>File Types</TableHead>
            <TableHead>Required</TableHead>
            <TableHead>Max Size</TableHead>
            <TableHead>Max Duration</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell><code className="text-xs">{row.code}</code></TableCell>
              <TableCell className="text-xs text-slate-600">{row.fileTypes}</TableCell>
              <TableCell>{row.isRequired ? "Yes" : "No"}</TableCell>
              <TableCell>{row.maxSizeMb} MB</TableCell>
              <TableCell>{row.maxDurationSec ? `${row.maxDurationSec}s` : "-"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-rose-600" onClick={() => remove(row.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg z-[220]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit requirement" : "Add requirement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value, code: editing ? f.code : slugify(e.target.value) }))
              }
            />
            <Input placeholder="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: slugify(e.target.value) }))} />
            <div>
              <p className="text-xs text-slate-500 mb-1">File types</p>
              <div className="grid grid-cols-2 gap-1">
                {FILE_TYPE_OPTIONS.map((ft) => (
                  <label key={ft} className="text-sm flex items-center gap-2">
                    <input type="checkbox" checked={form.fileTypes.includes(ft)} onChange={() => toggleFileType(ft)} />
                    {ft}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" min="1" placeholder="Max MB" value={form.maxSizeMb} onChange={(e) => setForm((f) => ({ ...f, maxSizeMb: e.target.value }))} />
              {hasVideo ? (
                <Input type="number" min="1" placeholder="Max sec" value={form.maxDurationSec} onChange={(e) => setForm((f) => ({ ...f, maxDurationSec: e.target.value }))} />
              ) : <div />}
              <Input type="number" min="0" placeholder="Sort" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
            </div>
            <Select
              value={form.isRequired ? "yes" : "no"}
              onValueChange={(v) => setForm((f) => ({ ...f, isRequired: v === "yes" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Required?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Required</SelectItem>
                <SelectItem value="no">Optional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentRequirementManager;
