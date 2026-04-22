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
  Link2,
  Copy,
  Briefcase,
} from "lucide-react";

const DRIVER_APP_URL = (() => {
  const configuredUrl = import.meta.env.VITE_DRIVER_APP_URL?.trim();
  if (configuredUrl) return configuredUrl;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:5173";
})();

function errMessage(err) {
  if (!err) return "Something went wrong";
  if (typeof err === "string") return err;
  return err.message || err.error || "Request failed";
}

function jobStatus(job) {
  if (job.closedAt) return "closed";
  if (job.isPublished) return "published";
  return "draft";
}

function statusBadge(job) {
  const s = jobStatus(job);
  if (s === "published") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
        Published
      </Badge>
    );
  }
  if (s === "closed") {
    return <Badge variant="secondary">Closed</Badge>;
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200">Draft</Badge>
  );
}

export default function JobManager() {
  const { toast } = useToast();
  const { adminRole } = useAdminAuth();
  const [jobs, setJobs] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [linksByJob, setLinksByJob] = useState({});

  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    requirements: "",
    cityId: "",
    contractTemplateId: "",
    requiresOwnVehicle: false,
  });
  const [templatesForCity, setTemplatesForCity] = useState([]);

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkJobId, setLinkJobId] = useState(null);
  const [linkExpiresAt, setLinkExpiresAt] = useState("");

  const [closeTarget, setCloseTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canMutate = adminRole && adminRole !== "admin_view";

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const [jobList, cityList] = await Promise.all([
        adminServices.getAllJobs(),
        adminServices.getAllCities(),
      ]);
      setJobs(jobList);
      setCities(cityList);
    } catch (e) {
      toast({
        title: "Could not load jobs",
        description: errMessage(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const loadTemplates = async (cityId) => {
    if (!cityId) {
      setTemplatesForCity([]);
      return;
    }
    try {
      const list = await adminServices.getContractTemplatesByCity(Number(cityId));
      setTemplatesForCity(list.filter((t) => t.isActive));
    } catch {
      setTemplatesForCity([]);
    }
  };

  const openCreateJob = () => {
    setEditingJob(null);
    setJobForm({
      title: "",
      description: "",
      requirements: "",
      cityId: cities[0]?.id?.toString() || "",
      contractTemplateId: "",
      requiresOwnVehicle: false,
    });
    if (cities[0]?.id) loadTemplates(cities[0].id);
    else setTemplatesForCity([]);
    setJobDialogOpen(true);
  };

  const openEditJob = async (j) => {
    setEditingJob(j);
    setJobForm({
      title: j.title,
      description: j.description || "",
      requirements: j.requirements || "",
      cityId: String(j.cityId ?? j.city?.id ?? ""),
      contractTemplateId: j.contractTemplateId
        ? String(j.contractTemplateId)
        : "",
      requiresOwnVehicle: Boolean(j.requiresOwnVehicle),
    });
    const cid = j.cityId ?? j.city?.id;
    if (cid) await loadTemplates(cid);
    setJobDialogOpen(true);
  };

  const saveJob = async () => {
    const cityId = Number(jobForm.cityId);
    if (!jobForm.title.trim() || !cityId) {
      toast({
        title: "Missing fields",
        description: "Title and city are required.",
        variant: "destructive",
      });
      return;
    }
    const payload = {
      cityId,
      title: jobForm.title.trim(),
      description: jobForm.description.trim() || null,
      requirements: jobForm.requirements.trim() || null,
      contractTemplateId: jobForm.contractTemplateId
        ? Number(jobForm.contractTemplateId)
        : null,
      requiresOwnVehicle: Boolean(jobForm.requiresOwnVehicle),
    };
    try {
      if (editingJob) {
        await adminServices.updateJob(editingJob.id, payload);
        toast({ title: "Job updated" });
      } else {
        await adminServices.createJob(payload);
        toast({ title: "Job created" });
      }
      setJobDialogOpen(false);
      await loadJobs();
    } catch (e) {
      toast({
        title: "Save failed",
        description: errMessage(e),
        variant: "destructive",
      });
    }
  };

  const loadLinksForJob = useCallback(
    async (jobId) => {
      try {
        const links = await adminServices.getPublicLinks(jobId);
        setLinksByJob((prev) => ({ ...prev, [jobId]: links }));
      } catch (e) {
        toast({
          title: "Could not load links",
          description: errMessage(e),
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  useEffect(() => {
    if (expandedId != null) {
      loadLinksForJob(expandedId);
    }
  }, [expandedId, loadLinksForJob]);

  const openGenerateLink = (jobId) => {
    setLinkJobId(jobId);
    setLinkExpiresAt("");
    setLinkDialogOpen(true);
  };

  const createLink = async () => {
    if (!linkJobId) return;
    const data = {};
    if (linkExpiresAt) {
      data.expiresAt = new Date(linkExpiresAt).toISOString();
    }
    try {
      await adminServices.createPublicLink(linkJobId, data);
      toast({ title: "Link created" });
      setLinkDialogOpen(false);
      await loadLinksForJob(linkJobId);
      await loadJobs();
    } catch (e) {
      toast({
        title: "Could not create link",
        description: errMessage(e),
        variant: "destructive",
      });
    }
  };

  const deactivateLink = async (jobId, linkId) => {
    try {
      await adminServices.deactivatePublicLink(linkId);
      toast({ title: "Link deactivated" });
      await loadLinksForJob(jobId);
    } catch (e) {
      toast({
        title: "Failed",
        description: errMessage(e),
        variant: "destructive",
      });
    }
  };

  const copyApplyUrl = (slug) => {
    const url = `${DRIVER_APP_URL.replace(/\/$/, "")}/apply/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copied", description: url });
  };

  const confirmClose = async () => {
    if (!closeTarget) return;
    try {
      await adminServices.closeJob(closeTarget.id);
      toast({ title: "Job closed" });
      setCloseTarget(null);
      setExpandedId(null);
      await loadJobs();
    } catch (e) {
      toast({
        title: "Close failed",
        description: errMessage(e),
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminServices.deleteJob(deleteTarget.id);
      toast({ title: "Job deleted" });
      setDeleteTarget(null);
      setExpandedId(null);
      await loadJobs();
    } catch (e) {
      toast({
        title: "Delete failed",
        description: errMessage(e),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="adm-card">
        <CardContent className="py-12 text-center text-sm text-slate-500">
          Loading jobs…
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
              <Briefcase className="h-5 w-5 text-brand-blue" />
              Jobs
            </CardTitle>
            <CardDescription>
              Create postings, publish when ready, and share apply links (
              <code className="text-xs bg-slate-100 px-1 rounded">
                {DRIVER_APP_URL}/apply/&lt;slug&gt;
              </code>
              ). Set <code className="text-xs">VITE_DRIVER_APP_URL</code> in admin-web if needed.
            </CardDescription>
          </div>
          {canMutate && (
            <Button
              type="button"
              onClick={openCreateJob}
              className="bg-brand-blue hover:bg-brand-shadeBlue shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              New job
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-200/80 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="w-10" />
                  <TableHead>Title</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Applications</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right w-52">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                      No jobs yet. Create a city and contract template first, then add a job.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((j) => (
                    <Fragment key={j.id}>
                      <TableRow className="hover:bg-slate-50/50">
                        <TableCell>
                          <button
                            type="button"
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-600"
                            onClick={() =>
                              setExpandedId(expandedId === j.id ? null : j.id)
                            }
                          >
                            {expandedId === j.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate" title={j.title}>
                          {j.title}
                        </TableCell>
                        <TableCell className="text-sm">
                          {j.city?.city || "—"}
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {j.contractTemplate?.type?.replace("_", " ") || "—"}
                        </TableCell>
                        <TableCell>{statusBadge(j)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {j._count?.applications ?? 0}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                          {j.createdAt
                            ? new Date(j.createdAt).toLocaleDateString("en-GB")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {canMutate && (
                            <div className="flex flex-wrap justify-end gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => openEditJob(j)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              {!j.closedAt && !j.isPublished && (
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-8 bg-emerald-600 hover:bg-emerald-700"
                                  onClick={async () => {
                                    try {
                                      await adminServices.publishJob(j.id);
                                      toast({ title: "Published" });
                                      loadJobs();
                                    } catch (e) {
                                      toast({
                                        title: "Publish failed",
                                        description: errMessage(e),
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  Publish
                                </Button>
                              )}
                              {!j.closedAt && j.isPublished && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  onClick={async () => {
                                    try {
                                      await adminServices.unpublishJob(j.id);
                                      toast({ title: "Unpublished" });
                                      loadJobs();
                                    } catch (e) {
                                      toast({
                                        title: "Failed",
                                        description: errMessage(e),
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  Unpublish
                                </Button>
                              )}
                              {!j.closedAt && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => setCloseTarget(j)}
                                >
                                  Close
                                </Button>
                              )}
                              {(j._count?.applications ?? 0) === 0 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-rose-600"
                                  onClick={() => setDeleteTarget(j)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedId === j.id && (
                        <TableRow className="bg-slate-50/40">
                          <TableCell colSpan={8} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-semibold flex items-center gap-2">
                                <Link2 className="h-4 w-4" />
                                Public apply links
                              </p>
                              {canMutate && !j.closedAt && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => openGenerateLink(j.id)}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  Generate link
                                </Button>
                              )}
                            </div>
                            {j.closedAt && (
                              <p className="text-sm text-amber-800 mb-2">
                                This job is closed; public links are deactivated.
                              </p>
                            )}
                            {(linksByJob[j.id] || []).length === 0 ? (
                              <p className="text-sm text-slate-500">
                                No links yet. Publish the job, then generate a link.
                              </p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>URL</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Clicks</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(linksByJob[j.id] || []).map((link) => {
                                    const url = `${DRIVER_APP_URL.replace(/\/$/, "")}/apply/${link.slug}`;
                                    return (
                                      <TableRow key={link.id}>
                                        <TableCell className="max-w-[280px]">
                                          <code className="text-xs break-all">{url}</code>
                                        </TableCell>
                                        <TableCell>
                                          {link.isActive ? (
                                            <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                              Active
                                            </Badge>
                                          ) : (
                                            <Badge variant="secondary" className="text-xs">
                                              Inactive
                                            </Badge>
                                          )}
                                        </TableCell>
                                        <TableCell className="tabular-nums">
                                          {link.clickCount}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                          {link.expiresAt
                                            ? new Date(link.expiresAt).toLocaleString("en-GB")
                                            : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 mr-1"
                                            onClick={() => copyApplyUrl(link.slug)}
                                          >
                                            <Copy className="h-3.5 w-3.5" />
                                          </Button>
                                          {canMutate && link.isActive && (
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="h-8 text-rose-600"
                                              onClick={() => deactivateLink(j.id, link.id)}
                                            >
                                              Deactivate
                                            </Button>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            )}
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

      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto z-[200]">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Edit job" : "New job"}</DialogTitle>
            <DialogDescription>
              Link the job to a city and optional contract template.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="job-title">Title</Label>
              <Input
                id="job-title"
                value={jobForm.title}
                onChange={(e) =>
                  setJobForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="London courier — evening shifts"
              />
            </div>
            <div className="grid gap-2">
              <Label>City</Label>
              <Select
                value={jobForm.cityId}
                onValueChange={(v) => {
                  setJobForm((f) => ({
                    ...f,
                    cityId: v,
                    contractTemplateId: "",
                  }));
                  loadTemplates(v);
                }}
                disabled={!!editingJob}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent className="z-[250]">
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.city} ({c.cityCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Contract template (optional)</Label>
              <Select
                value={jobForm.contractTemplateId || "__none__"}
                onValueChange={(v) =>
                  setJobForm((f) => ({
                    ...f,
                    contractTemplateId: v === "__none__" ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="z-[250]">
                  <SelectItem value="__none__">None</SelectItem>
                  {templatesForCity.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name} ({t.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-desc">Description</Label>
              <Textarea
                id="job-desc"
                rows={4}
                value={jobForm.description}
                onChange={(e) =>
                  setJobForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-req">Requirements</Label>
              <Textarea
                id="job-req"
                rows={3}
                value={jobForm.requirements}
                onChange={(e) =>
                  setJobForm((f) => ({ ...f, requirements: e.target.value }))
                }
              />
            </div>
            <div className="flex items-start gap-3 rounded-md border border-slate-200 p-3">
              <input
                id="job-requires-vehicle"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300"
                checked={jobForm.requiresOwnVehicle}
                onChange={(e) =>
                  setJobForm((f) => ({ ...f, requiresOwnVehicle: e.target.checked }))
                }
              />
              <div>
                <Label htmlFor="job-requires-vehicle" className="cursor-pointer font-medium">
                  Requires own vehicle
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Candidates without their own vehicle will be rejected during screening when this is enabled.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJobDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-brand-blue hover:bg-brand-shadeBlue"
              onClick={saveJob}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="z-[200]">
          <DialogHeader>
            <DialogTitle>Generate apply link</DialogTitle>
            <DialogDescription>
              Optional expiry. The job must be published for candidates to load the page.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="link-exp">Expires at (optional)</Label>
            <Input
              id="link-exp"
              type="datetime-local"
              value={linkExpiresAt}
              onChange={(e) => setLinkExpiresAt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-brand-blue hover:bg-brand-shadeBlue"
              onClick={createLink}
            >
              Create link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!closeTarget} onOpenChange={(o) => !o && setCloseTarget(null)}>
        <AlertDialogContent className="z-[200]">
          <AlertDialogHeader>
            <AlertDialogTitle>Close this job?</AlertDialogTitle>
            <AlertDialogDescription>
              All public links will be deactivated and the job will be unpublished. Re-opening a
              closed job is not available in the admin UI yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700"
              onClick={confirmClose}
            >
              Close job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="z-[200]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete job permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Only allowed when there are no applications. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
