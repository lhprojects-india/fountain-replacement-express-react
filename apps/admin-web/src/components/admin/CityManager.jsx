import { useState, useEffect, useCallback, Fragment } from "react";
import { adminServices } from "../../lib/admin-services.js";
import { useAdminAuth } from "../../context/AdminAuthContext";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  useToast,
} from "@lh/shared";
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  Globe,
} from "lucide-react";
import DocumentRequirementManager from "./DocumentRequirementManager";

const DEFAULT_PAYMENT_SCHEMA = `{\n  "fields": [\n    { "key": "bank_name", "label": "Bank Name", "type": "text", "required": true }\n  ]\n}`;

const COMMON_TIMEZONES = [
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
];

const PAYMENT_PRESETS = {
  UK: {
    fields: [
      { key: "bank_name", label: "Bank Name", type: "text", required: true },
      { key: "account_number", label: "Account Number", type: "text", required: true },
      { key: "sort_code", label: "Sort Code", type: "text", required: true },
    ],
  },
  EU: {
    fields: [
      { key: "bank_name", label: "Bank Name", type: "text", required: true },
      { key: "iban", label: "IBAN", type: "text", required: true },
      { key: "bic", label: "BIC/SWIFT", type: "text", required: true },
    ],
  },
};

const CONTRACT_TYPES = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "contractor", label: "Contractor" },
];

function errMessage(err) {
  if (!err) return "Something went wrong";
  if (typeof err === "string") return err;
  return err.message || err.error || "Request failed";
}

export default function CityManager() {
  const { toast } = useToast();
  const { adminRole } = useAdminAuth();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [cityForm, setCityForm] = useState({
    city: "",
    cityCode: "",
    country: "",
    currency: "",
    currencySymbol: "",
    timezone: "Europe/London",
    paymentFieldsJson: DEFAULT_PAYMENT_SCHEMA,
    seedDocumentDefaults: true,
    isActive: true,
  });

  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [contractCityId, setContractCityId] = useState(null);
  const [editingContract, setEditingContract] = useState(null);
  const [contractForm, setContractForm] = useState({
    name: "",
    type: "full_time",
    dropboxSignTemplateId: "",
    content: "",
    isActive: true,
  });

  const [deleteCityTarget, setDeleteCityTarget] = useState(null);
  const [deleteContractTarget, setDeleteContractTarget] = useState(null);
  const [dropboxCreateOpen, setDropboxCreateOpen] = useState(false);
  const [dropboxTargetContract, setDropboxTargetContract] = useState(null);
  const [dropboxForm, setDropboxForm] = useState({
    templateTitle: "",
    signerRole: "Driver",
    templateFile: null,
  });
  const [creatingDropboxTemplate, setCreatingDropboxTemplate] = useState(false);

  const canMutate = adminRole && adminRole !== "admin_view";
  const canCreateCity =
    adminRole === "super_admin" || adminRole === "app_admin";
  const canDeleteCity = adminRole === "super_admin";

  const loadCities = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminServices.getAllCities();
      setCities(list);
    } catch (e) {
      toast({
        title: "Could not load cities",
        description: errMessage(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  const openCreateCity = () => {
    setEditingCity(null);
    setCityForm({
      city: "",
      cityCode: "",
      country: "",
      currency: "",
      currencySymbol: "",
      timezone: "Europe/London",
      paymentFieldsJson: DEFAULT_PAYMENT_SCHEMA,
      seedDocumentDefaults: true,
      isActive: true,
    });
    setCityDialogOpen(true);
  };

  const openEditCity = (c) => {
    setEditingCity(c);
    setCityForm({
      city: c.city,
      cityCode: c.cityCode,
      country: c.country || "",
      currency: c.currency,
      currencySymbol: c.currencySymbol,
      timezone: c.timezone,
      paymentFieldsJson: c.paymentFieldsSchema
        ? JSON.stringify(c.paymentFieldsSchema, null, 2)
        : DEFAULT_PAYMENT_SCHEMA,
      seedDocumentDefaults: false,
      isActive: c.isActive,
    });
    setCityDialogOpen(true);
  };

  const saveCity = async () => {
    let paymentFieldsSchema = null;
    const raw = cityForm.paymentFieldsJson?.trim();
    if (raw) {
      try {
        paymentFieldsSchema = JSON.parse(raw);
        if (typeof paymentFieldsSchema !== "object" || paymentFieldsSchema === null) {
          throw new Error("Payment schema must be a JSON object");
        }
      } catch (e) {
        toast({
          title: "Invalid payment schema JSON",
          description: e.message || "Check the JSON syntax",
          variant: "destructive",
        });
        return;
      }
    }
    const payload = {
      city: cityForm.city.trim(),
      cityCode: cityForm.cityCode.trim(),
      country: cityForm.country.trim() || "Unknown",
      currency: cityForm.currency.trim(),
      currencySymbol: cityForm.currencySymbol.trim(),
      timezone: cityForm.timezone,
      paymentFieldsSchema,
      seedDocumentDefaults: Boolean(cityForm.seedDocumentDefaults),
      isActive: cityForm.isActive,
    };
    try {
      if (editingCity) {
        await adminServices.updateCity(editingCity.id, payload);
        toast({ title: "City updated" });
      } else {
        await adminServices.createCity(payload);
        toast({ title: "City created" });
      }
      setCityDialogOpen(false);
      await loadCities();
    } catch (e) {
      toast({
        title: "Save failed",
        description: errMessage(e),
        variant: "destructive",
      });
    }
  };

  const confirmDeleteCity = async () => {
    if (!deleteCityTarget) return;
    try {
      await adminServices.deleteCity(deleteCityTarget.id);
      toast({ title: "City deactivated" });
      setDeleteCityTarget(null);
      if (expandedId === deleteCityTarget.id) setExpandedId(null);
      await loadCities();
    } catch (e) {
      toast({
        title: "Could not deactivate city",
        description: errMessage(e),
        variant: "destructive",
      });
    }
  };

  const openCreateContract = (cityId) => {
    setContractCityId(cityId);
    setEditingContract(null);
    setContractForm({
      name: "",
      type: "full_time",
      dropboxSignTemplateId: "",
      content: "",
      isActive: true,
    });
    setContractDialogOpen(true);
  };

  const openEditContract = (tpl, cityId) => {
    setContractCityId(cityId);
    setEditingContract(tpl);
    setContractForm({
      name: tpl.name,
      type: tpl.type,
      dropboxSignTemplateId: tpl.dropboxSignTemplateId || "",
      content: tpl.content || "",
      isActive: tpl.isActive,
    });
    setContractDialogOpen(true);
  };

  const saveContract = async () => {
    const payload = {
      cityId: contractCityId,
      name: contractForm.name.trim(),
      type: contractForm.type,
      dropboxSignTemplateId: contractForm.dropboxSignTemplateId.trim() || null,
      content: contractForm.content.trim() || null,
      isActive: contractForm.isActive,
    };
    try {
      if (editingContract) {
        const { cityId: _c, ...updateBody } = payload;
        await adminServices.updateContractTemplate(editingContract.id, updateBody);
        toast({ title: "Contract template updated" });
      } else {
        await adminServices.createContractTemplate(payload);
        toast({ title: "Contract template created" });
      }
      setContractDialogOpen(false);
      await loadCities();
    } catch (e) {
      toast({
        title: "Save failed",
        description: errMessage(e),
        variant: "destructive",
      });
    }
  };

  const confirmDeleteContract = async () => {
    if (!deleteContractTarget) return;
    try {
      await adminServices.deleteContractTemplate(deleteContractTarget.id);
      toast({ title: "Contract template deactivated" });
      setDeleteContractTarget(null);
      await loadCities();
    } catch (e) {
      toast({
        title: "Could not deactivate template",
        description: errMessage(e),
        variant: "destructive",
      });
    }
  };

  const openCreateDropboxTemplate = (contractTemplate) => {
    setDropboxTargetContract(contractTemplate);
    setDropboxForm({
      templateTitle: contractTemplate?.name || "",
      signerRole: "Driver",
      templateFile: null,
    });
    setDropboxCreateOpen(true);
  };

  const createDropboxTemplate = async () => {
    if (!dropboxTargetContract?.id) return;
    if (!dropboxForm.templateTitle.trim()) {
      toast({
        title: "Template title is required",
        variant: "destructive",
      });
      return;
    }
    if (!dropboxForm.templateFile) {
      toast({
        title: "Template file is required",
        description: "Upload a PDF document to create the Dropbox Sign template.",
        variant: "destructive",
      });
      return;
    }
    setCreatingDropboxTemplate(true);
    try {
      await adminServices.createAndLinkDropboxTemplate(dropboxTargetContract.id, {
        templateTitle: dropboxForm.templateTitle.trim(),
        signerRole: dropboxForm.signerRole.trim() || "Driver",
        templateFile: dropboxForm.templateFile,
      });
      toast({ title: "Dropbox Sign template created and linked" });
      setDropboxCreateOpen(false);
      setDropboxTargetContract(null);
      await loadCities();
    } catch (e) {
      toast({
        title: "Could not create template",
        description: errMessage(e),
        variant: "destructive",
      });
    } finally {
      setCreatingDropboxTemplate(false);
    }
  };

  if (loading) {
    return (
      <Card className="adm-card">
        <CardContent className="py-12 text-center text-sm text-slate-500">
          Loading cities…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="adm-card">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-brand-blue" />
              Cities
            </CardTitle>
            <CardDescription>
              Cities and markets: currency, timezone, and payment field definitions for
              drivers. Dropbox Sign template IDs on contracts are optional until you configure
              signing.
            </CardDescription>
          </div>
          {canCreateCity && (
            <Button
              type="button"
              onClick={openCreateCity}
              className="bg-brand-blue hover:bg-brand-shadeBlue shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add city
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-200/80 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="w-10" />
                  <TableHead>City</TableHead>
                  <TableHead>City Code</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                  <TableHead className="text-right">Templates</TableHead>
                  <TableHead className="text-right w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-slate-500">
                      No cities yet. {canCreateCity ? "Create one to start posting jobs." : ""}
                    </TableCell>
                  </TableRow>
                ) : (
                  cities.map((c) => (
                    <Fragment key={c.id}>
                      <TableRow className="hover:bg-slate-50/50">
                        <TableCell>
                          <button
                            type="button"
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-600"
                            onClick={() =>
                              setExpandedId(expandedId === c.id ? null : c.id)
                            }
                            aria-expanded={expandedId === c.id}
                          >
                            {expandedId === c.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="font-medium">{c.city}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                            {c.cityCode}
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{c.country}</TableCell>
                        <TableCell>
                          {c.currencySymbol} {c.currency}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 max-w-[140px] truncate" title={c.timezone}>
                          {c.timezone}
                        </TableCell>
                        <TableCell>
                          {c.isActive ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {c._count?.jobs ?? 0}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {c._count?.contractTemplates ?? c.contractTemplates?.length ?? 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canMutate && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => openEditCity(c)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {canDeleteCity && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-rose-600 border-rose-200 hover:bg-rose-50"
                                onClick={() => setDeleteCityTarget(c)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedId === c.id && (
                        <TableRow className="bg-slate-50/40">
                          <TableCell colSpan={10} className="p-4">
                            <div className="space-y-6">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                                <FileText className="h-4 w-4" />
                                Contract templates
                                </p>
                                {canMutate && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => openCreateContract(c.id)}
                                  >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Add template
                                  </Button>
                                )}
                              </div>
                              {(c.contractTemplates || []).length === 0 ? (
                                <p className="text-sm text-slate-500">
                                  No templates yet. Add one for each employment type you hire under.
                                </p>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Dropbox Sign</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {(c.contractTemplates || []).map((t) => (
                                      <TableRow key={t.id}>
                                        <TableCell className="font-medium">{t.name}</TableCell>
                                        <TableCell className="text-sm capitalize">
                                          {t.type?.replace("_", " ")}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                          {t.dropboxSignTemplateId ? (
                                            <span className="text-emerald-700">Configured</span>
                                          ) : (
                                            <span className="text-amber-700">Not set</span>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {t.isActive ? (
                                            <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                              Active
                                            </Badge>
                                          ) : (
                                            <Badge variant="secondary" className="text-xs">
                                              Inactive
                                            </Badge>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {canMutate && (
                                            <div className="flex justify-end gap-1">
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8"
                                                onClick={() => openEditContract(t, c.id)}
                                              >
                                                <Edit className="h-3.5 w-3.5" />
                                              </Button>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8"
                                                onClick={() => openCreateDropboxTemplate(t)}
                                              >
                                                Create DS
                                              </Button>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-rose-600"
                                                onClick={() => setDeleteContractTarget(t)}
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </Button>
                                            </div>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}

                              <div className="pt-4 border-t">
                                <DocumentRequirementManager cityId={c.id} />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
        <DialogContent className="adm-modal max-w-lg max-h-[90vh] overflow-y-auto z-[200]">
          <DialogHeader>
            <DialogTitle>{editingCity ? "Edit city" : "New city"}</DialogTitle>
            <DialogDescription>
              Payment fields schema is stored as JSON and drives future payment-detail forms.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="city-name">City Name</Label>
              <Input
                id="city-name"
                value={cityForm.city}
                onChange={(e) =>
                  setCityForm((f) => ({ ...f, city: e.target.value }))
                }
                placeholder="London"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city-code">City Code (2–20 characters)</Label>
              <Input
                id="city-code"
                value={cityForm.cityCode}
                onChange={(e) =>
                  setCityForm((f) => ({ ...f, cityCode: e.target.value.toUpperCase() }))
                }
                placeholder="LON"
                maxLength={20}
                disabled={!!editingCity}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city-country">Country</Label>
              <Input
                id="city-country"
                value={cityForm.country}
                onChange={(e) =>
                  setCityForm((f) => ({ ...f, country: e.target.value }))
                }
                placeholder="United Kingdom"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="city-curr">Currency</Label>
                <Input
                  id="city-curr"
                  value={cityForm.currency}
                  onChange={(e) =>
                    setCityForm((f) => ({ ...f, currency: e.target.value }))
                  }
                  placeholder="GBP"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city-sym">Symbol</Label>
                <Input
                  id="city-sym"
                  value={cityForm.currencySymbol}
                  onChange={(e) =>
                    setCityForm((f) => ({ ...f, currencySymbol: e.target.value }))
                  }
                  placeholder="£"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Timezone</Label>
              <Select
                value={cityForm.timezone}
                onValueChange={(v) =>
                  setCityForm((f) => ({ ...f, timezone: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[250] max-h-60">
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city-pay">Payment fields schema (JSON)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCityForm((f) => ({ ...f, paymentFieldsJson: JSON.stringify(PAYMENT_PRESETS.UK, null, 2) }))}
                >
                  UK Bank Details
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCityForm((f) => ({ ...f, paymentFieldsJson: JSON.stringify(PAYMENT_PRESETS.EU, null, 2) }))}
                >
                  EU SEPA
                </Button>
              </div>
              <Textarea
                id="city-pay"
                rows={8}
                className="font-mono text-xs"
                value={cityForm.paymentFieldsJson}
                onChange={(e) =>
                  setCityForm((f) => ({ ...f, paymentFieldsJson: e.target.value }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              {!editingCity && (
                <>
                  <input
                    type="checkbox"
                    id="city-seed-docs"
                    checked={cityForm.seedDocumentDefaults}
                    onChange={(e) =>
                      setCityForm((f) => ({ ...f, seedDocumentDefaults: e.target.checked }))
                    }
                    className="rounded border-slate-300"
                  />
                  <Label htmlFor="city-seed-docs" className="font-normal cursor-pointer mr-4">
                    Seed default document requirements
                  </Label>
                </>
              )}
              <input
                type="checkbox"
                id="city-active"
                checked={cityForm.isActive}
                onChange={(e) =>
                  setCityForm((f) => ({ ...f, isActive: e.target.checked }))
                }
                className="rounded border-slate-300"
              />
              <Label htmlFor="city-active" className="font-normal cursor-pointer">
                City is active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCityDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-brand-blue hover:bg-brand-shadeBlue"
              onClick={saveCity}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
        <DialogContent className="adm-modal max-w-lg z-[200]">
          <DialogHeader>
            <DialogTitle>
              {editingContract ? "Edit contract template" : "New contract template"}
            </DialogTitle>
            <DialogDescription>
              Dropbox Sign template ID is optional; add it when signing is configured.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="ct-name">Name</Label>
              <Input
                id="ct-name"
                value={contractForm.name}
                onChange={(e) =>
                  setContractForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Standard driver agreement"
              />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select
                value={contractForm.type}
                onValueChange={(v) =>
                  setContractForm((f) => ({ ...f, type: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[250]">
                  {CONTRACT_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ct-dbx">Dropbox Sign template ID (optional)</Label>
              <Input
                id="ct-dbx"
                value={contractForm.dropboxSignTemplateId}
                onChange={(e) =>
                  setContractForm((f) => ({
                    ...f,
                    dropboxSignTemplateId: e.target.value,
                  }))
                }
                placeholder="Leave blank until Dropbox Sign is set up"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ct-content">Preview / fallback content (optional)</Label>
              <Textarea
                id="ct-content"
                rows={5}
                value={contractForm.content}
                onChange={(e) =>
                  setContractForm((f) => ({ ...f, content: e.target.value }))
                }
                placeholder="Plain-text summary or HTML-free notes for admins"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ct-active"
                checked={contractForm.isActive}
                onChange={(e) =>
                  setContractForm((f) => ({ ...f, isActive: e.target.checked }))
                }
                className="rounded border-slate-300"
              />
              <Label htmlFor="ct-active" className="font-normal cursor-pointer">
                Template is active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContractDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-brand-blue hover:bg-brand-shadeBlue"
              onClick={saveContract}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dropboxCreateOpen} onOpenChange={setDropboxCreateOpen}>
        <DialogContent className="adm-modal max-w-lg z-[220]">
          <DialogHeader>
            <DialogTitle>Create Dropbox Sign template</DialogTitle>
            <DialogDescription>
              Upload a PDF and create a template in Dropbox Sign. On success we will link the
              generated template ID to this contract template automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Contract template</Label>
              <div className="text-sm text-slate-700">
                {dropboxTargetContract?.name || "N/A"}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dbx-title">Dropbox template title</Label>
              <Input
                id="dbx-title"
                value={dropboxForm.templateTitle}
                onChange={(e) =>
                  setDropboxForm((f) => ({ ...f, templateTitle: e.target.value }))
                }
                placeholder="Driver agreement - London"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dbx-role">Signer role</Label>
              <Input
                id="dbx-role"
                value={dropboxForm.signerRole}
                onChange={(e) =>
                  setDropboxForm((f) => ({ ...f, signerRole: e.target.value }))
                }
                placeholder="Driver"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dbx-file">Template file (PDF)</Label>
              <Input
                id="dbx-file"
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  setDropboxForm((f) => ({
                    ...f,
                    templateFile: e.target.files?.[0] || null,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDropboxCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-brand-blue hover:bg-brand-shadeBlue"
              onClick={createDropboxTemplate}
              disabled={creatingDropboxTemplate}
            >
              {creatingDropboxTemplate ? "Creating..." : "Create and link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteCityTarget}
        onOpenChange={(o) => !o && setDeleteCityTarget(null)}
      >
        <AlertDialogContent className="z-[200]">
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate city?</AlertDialogTitle>
            <AlertDialogDescription>
              This sets the city to inactive. You cannot deactivate a city that still has
              published jobs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={confirmDeleteCity}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteContractTarget}
        onOpenChange={(o) => !o && setDeleteContractTarget(null)}
      >
        <AlertDialogContent className="z-[200]">
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate contract template?</AlertDialogTitle>
            <AlertDialogDescription>
              Templates linked to published jobs cannot be deactivated until those jobs are
              unpublished.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={confirmDeleteContract}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
