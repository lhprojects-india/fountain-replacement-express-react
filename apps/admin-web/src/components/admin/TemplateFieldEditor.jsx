import { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { adminServices } from "../../lib/admin-services.js";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Badge,
  useToast,
} from "@lh/shared";
import {
  PenLine,
  Type,
  Calendar,
  User,
  Mail,
  CheckSquare,
  Fingerprint,
  Trash2,
  Upload,
  Save,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const FIELD_TYPES = [
  { type: "signature", label: "Signature", icon: PenLine, color: "bg-blue-100 border-blue-400 text-blue-800" },
  { type: "initials", label: "Initials", icon: Fingerprint, color: "bg-purple-100 border-purple-400 text-purple-800" },
  { type: "date", label: "Date Signed", icon: Calendar, color: "bg-amber-100 border-amber-400 text-amber-800" },
  { type: "fullName", label: "Full Name", icon: User, color: "bg-emerald-100 border-emerald-400 text-emerald-800" },
  { type: "email", label: "Email", icon: Mail, color: "bg-cyan-100 border-cyan-400 text-cyan-800" },
  { type: "text", label: "Text", icon: Type, color: "bg-slate-100 border-slate-400 text-slate-800" },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare, color: "bg-rose-100 border-rose-400 text-rose-800" },
];

const FIELD_DEFAULTS = {
  signature: { width: 125, height: 20 },
  initials: { width: 125, height: 20 },
  date: { width: 125, height: 20 },
  fullName: { width: 125, height: 20 },
  email: { width: 125, height: 20 },
  text: { width: 125, height: 20 },
  checkbox: { width: 125, height: 20 },
};

function fieldColor(type) {
  return FIELD_TYPES.find((f) => f.type === type)?.color ?? "bg-slate-100 border-slate-400 text-slate-800";
}
function fieldLabel(type) {
  return FIELD_TYPES.find((f) => f.type === type)?.label ?? type;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, parsed);
}

export default function TemplateFieldEditor({ contractTemplate, open, onClose, onSaved }) {
  const { toast } = useToast();

  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [pageSize, setPageSize] = useState({ width: 595, height: 842 });

  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [activeType, setActiveType] = useState("signature");
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sizeDraft, setSizeDraft] = useState({ width: "", height: "" });

  const pageRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load existing data
  useEffect(() => {
    if (!open || !contractTemplate) return;
    const existing = contractTemplate.templateFields;
    if (Array.isArray(existing) && existing.length > 0) {
      setFields(existing);
    } else {
      setFields([]);
    }
    setCurrentPage(1);
    setSelectedFieldId(null);
    if (pdfUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);

    if (contractTemplate.templatePdfKey) {
      adminServices.getTemplatePdfBlobUrl(contractTemplate.id)
        .then((url) => setPdfUrl(url))
        .catch(() => setPdfUrl(null));
    }
  }, [open, contractTemplate]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Only PDF files are supported", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      await adminServices.uploadTemplatePdf(contractTemplate.id, file);
      const localUrl = URL.createObjectURL(file);
      setPdfUrl(localUrl);
      setFields([]);
      toast({ title: "PDF uploaded" });
    } catch (err) {
      toast({ title: "Upload failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const onDocumentLoad = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  }, []);

  const onPageLoad = useCallback((page) => {
    setPageSize({ width: page.width, height: page.height });
  }, []);

  // Place a field on click (when no drag in progress)
  const handlePageClick = useCallback(
    (e) => {
      if (dragging || resizing) return;
      const rect = pageRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      const defaults = FIELD_DEFAULTS[activeType] ?? { width: 120, height: 32 };
      const newField = {
        id: genId(),
        type: activeType,
        page: currentPage,
        x: Math.round(x - defaults.width / 2),
        y: Math.round(y - defaults.height / 2),
        width: defaults.width,
        height: defaults.height,
        label: fieldLabel(activeType),
        required: true,
        signerRole: "Driver",
      };
      setFields((prev) => [...prev, newField]);
      setSelectedFieldId(newField.id);
    },
    [activeType, currentPage, scale, dragging, resizing]
  );

  // Drag field
  const startDrag = (e, fieldId) => {
    e.stopPropagation();
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = field.x;
    const origY = field.y;
    setDragging(fieldId);
    setSelectedFieldId(fieldId);

    const onMove = (me) => {
      const dx = (me.clientX - startX) / scale;
      const dy = (me.clientY - startY) / scale;
      setFields((prev) =>
        prev.map((f) =>
          f.id === fieldId
            ? { ...f, x: Math.round(origX + dx), y: Math.round(origY + dy) }
            : f
        )
      );
    };
    const onUp = () => {
      setDragging(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Resize field
  const startResize = (e, fieldId) => {
    e.stopPropagation();
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const origW = field.width;
    const origH = field.height;
    setResizing(fieldId);

    const onMove = (me) => {
      const dw = (me.clientX - startX) / scale;
      const dh = (me.clientY - startY) / scale;
      setFields((prev) =>
        prev.map((f) =>
          f.id === fieldId
            ? { ...f, width: Math.max(24, Math.round(origW + dw)), height: Math.max(16, Math.round(origH + dh)) }
            : f
        )
      );
    };
    const onUp = () => {
      setResizing(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const deleteField = (id) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const saveFields = async () => {
    setSaving(true);
    try {
      await adminServices.saveTemplateFields(contractTemplate.id, { fields });
      toast({ title: "Template fields saved" });
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast({ title: "Save failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const pageFields = fields.filter((f) => f.page === currentPage);
  const selectedField = fields.find((f) => f.id === selectedFieldId);

  useEffect(() => {
    if (!selectedField) {
      setSizeDraft({ width: "", height: "" });
      return;
    }
    setSizeDraft({
      width: String(selectedField.width ?? ""),
      height: String(selectedField.height ?? ""),
    });
  }, [selectedFieldId, selectedField?.width, selectedField?.height]);

  const commitSizeDraft = (key) => {
    if (!selectedField) return;
    const min = key === "width" ? 24 : 16;
    const current = key === "width" ? selectedField.width : selectedField.height;
    const raw = sizeDraft[key];
    const parsed = Number.parseInt(String(raw), 10);
    const next = Number.isFinite(parsed) ? Math.max(min, parsed) : current;
    setFields((prev) =>
      prev.map((f) => (f.id === selectedField.id ? { ...f, [key]: next } : f))
    );
    setSizeDraft((prev) => ({ ...prev, [key]: String(next) }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="adm-modal max-w-[96vw] w-[1200px] h-[92vh] z-[300] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-4 pb-2 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <PenLine className="h-4 w-4 text-brand-blue" />
            Template Field Editor
            {contractTemplate && (
              <Badge variant="secondary" className="ml-2 text-xs font-normal">{contractTemplate.name}</Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upload a PDF, select a field type, then click on the document to place fields. Drag to reposition, drag corner to resize.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-52 shrink-0 border-r flex flex-col bg-slate-50 overflow-y-auto">
            {/* Upload */}
            <div className="px-3 py-3 border-b">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Document</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                {uploading ? "Uploading…" : pdfUrl ? "Replace PDF" : "Upload PDF"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Field types */}
            <div className="px-3 py-3 border-b">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Add Field</p>
              <div className="flex flex-col gap-1">
                {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActiveType(type)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                      activeType === type
                        ? "bg-brand-blue text-white border-brand-blue"
                        : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Field properties */}
            {selectedField && (
              <div className="px-3 py-3 border-b">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Selected Field</p>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500">Type: </span>
                    <span className="font-medium capitalize">{fieldLabel(selectedField.type)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Page: </span>
                    <span className="font-medium">{selectedField.page}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Size: </span>
                    <span className="font-medium">{selectedField.width} × {selectedField.height}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <label className="text-slate-500 shrink-0">W:</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="border rounded px-1.5 py-0.5 text-xs w-full"
                        value={sizeDraft.width}
                        onChange={(e) =>
                          setSizeDraft((prev) => ({ ...prev, width: e.target.value }))
                        }
                        onBlur={() => commitSizeDraft("width")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commitSizeDraft("width");
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-slate-500 shrink-0">H:</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="border rounded px-1.5 py-0.5 text-xs w-full"
                        value={sizeDraft.height}
                        onChange={(e) =>
                          setSizeDraft((prev) => ({ ...prev, height: e.target.value }))
                        }
                        onBlur={() => commitSizeDraft("height")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commitSizeDraft("height");
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-slate-500">Label:</label>
                    <input
                      className="border rounded px-1.5 py-0.5 text-xs w-full"
                      value={selectedField.label ?? ""}
                      onChange={(e) =>
                        setFields((prev) =>
                          prev.map((f) =>
                            f.id === selectedField.id ? { ...f, label: e.target.value } : f
                          )
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-slate-500">Signer:</label>
                    <input
                      className="border rounded px-1.5 py-0.5 text-xs w-full"
                      value={selectedField.signerRole ?? ""}
                      onChange={(e) =>
                        setFields((prev) =>
                          prev.map((f) =>
                            f.id === selectedField.id ? { ...f, signerRole: e.target.value } : f
                          )
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="field-required"
                      checked={selectedField.required ?? true}
                      onChange={(e) =>
                        setFields((prev) =>
                          prev.map((f) =>
                            f.id === selectedField.id ? { ...f, required: e.target.checked } : f
                          )
                        )
                      }
                    />
                    <label htmlFor="field-required" className="text-slate-500 cursor-pointer">Required</label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs text-rose-600 border-rose-200 hover:bg-rose-50 mt-1"
                    onClick={() => deleteField(selectedField.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete field
                  </Button>
                </div>
              </div>
            )}

            {/* Fields list */}
            {fields.length > 0 && (
              <div className="px-3 py-3 flex-1 overflow-y-auto">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  All Fields ({fields.length})
                </p>
                <div className="flex flex-col gap-1">
                  {fields.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => { setSelectedFieldId(f.id); setCurrentPage(f.page); }}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs border transition-colors text-left ${
                        selectedFieldId === f.id
                          ? "ring-1 ring-brand-blue bg-blue-50 border-brand-blue"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`inline-block w-2 h-2 rounded-sm border ${fieldColor(f.type)}`} />
                      <span className="truncate">{f.label || fieldLabel(f.type)}</span>
                      <span className="text-slate-400 ml-auto shrink-0">p{f.page}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PDF canvas area */}
          <div className="flex-1 overflow-auto bg-slate-200 flex flex-col items-center">
            {/* Toolbar */}
            <div className="sticky top-0 z-10 w-full bg-white border-b px-4 py-2 flex items-center gap-3 shrink-0">
              <button
                type="button"
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-slate-600">
                Page {currentPage} / {numPages || "—"}
              </span>
              <button
                type="button"
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-slate-200 mx-1" />
              <button type="button" className="p-1 rounded hover:bg-slate-100" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs text-slate-500 w-10 text-center">{Math.round(scale * 100)}%</span>
              <button type="button" className="p-1 rounded hover:bg-slate-100" onClick={() => setScale((s) => Math.min(2.5, s + 0.1))}>
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="ml-auto text-xs text-slate-400">
                Click on document to place <span className="font-medium text-slate-600">{fieldLabel(activeType)}</span>
              </div>
            </div>

            {!pdfUrl ? (
              <div
                className="flex flex-col items-center justify-center h-full gap-4 text-slate-500 cursor-pointer hover:text-brand-blue"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10" />
                <p className="text-sm font-medium">Click to upload a PDF document</p>
                <p className="text-xs">or use the Upload PDF button on the left</p>
              </div>
            ) : (
              <div className="py-6 px-4">
                <Document file={pdfUrl} onLoadSuccess={onDocumentLoad}>
                  <div className="relative select-none" ref={pageRef} onClick={handlePageClick}>
                    <Page
                      pageNumber={currentPage}
                      scale={scale}
                      onLoadSuccess={onPageLoad}
                      renderAnnotationLayer
                      renderTextLayer
                    />
                    {/* Render fields overlay */}
                    {pageFields.map((field) => {
                      const isSelected = field.id === selectedFieldId;
                      return (
                        <div
                          key={field.id}
                          className={`absolute border-2 rounded flex items-center justify-center text-[10px] font-medium select-none ${fieldColor(field.type)} ${isSelected ? "ring-2 ring-offset-1 ring-brand-blue" : "opacity-80"} ${dragging === field.id ? "cursor-grabbing" : "cursor-grab"}`}
                          style={{
                            left: field.x * scale,
                            top: field.y * scale,
                            width: field.width * scale,
                            height: field.height * scale,
                            zIndex: 10,
                          }}
                          onMouseDown={(e) => {
                            if (e.button !== 0) return; // left click only
                            e.preventDefault();
                            startDrag(e, field.id);
                          }}
                          onClick={(e) => { e.stopPropagation(); setSelectedFieldId(field.id); }}
                          title="Drag to move field"
                        >
                          <span className="truncate px-1 pointer-events-none">{field.label || fieldLabel(field.type)}</span>
                          {/* Resize handle */}
                          <div
                            className="absolute bottom-0 right-0 w-3 h-3 bg-white border rounded-tl cursor-se-resize"
                            onMouseDown={(e) => { e.stopPropagation(); startResize(e, field.id); }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </Document>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-5 py-3 border-t shrink-0 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {fields.length} field{fields.length !== 1 ? "s" : ""} configured
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              className="bg-brand-blue hover:bg-brand-shadeBlue"
              onClick={saveFields}
              disabled={saving || (!pdfUrl && fields.length === 0)}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? "Saving…" : "Save template"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
