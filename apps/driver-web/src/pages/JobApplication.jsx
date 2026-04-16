import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  PageLayout,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@lh/shared";
import { publicServices } from "../lib/public-services.js";
import {
  Briefcase,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const VEHICLE_OPTIONS = [
  { value: "", label: "Select vehicle type" },
  { value: "small_car_hatchback", label: "Small Car / Hatchback" },
  { value: "large_car_sedan", label: "Large Car / Sedan" },
  { value: "small_van", label: "Small Van" },
  { value: "large_van", label: "Large Van" },
];

const applyFormSchema = z.object({
  firstName: z.string().trim().min(2, "Please enter your first name"),
  lastName: z.string().trim().min(2, "Please enter your last name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().min(8, "Enter a valid phone number with country code"),
  vehicleType: z.string().optional(),
  vehicleDetails: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
});

function storageKey(slug) {
  return `lh-apply-progress:${String(slug || "")}`;
}

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function ProgressSteps({ step, steps }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>Step {step + 1} of {steps.length}</span>
        <span>{steps[step]?.label}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full bg-brand-blue transition-all"
          style={{ width: `${Math.round(((step + 1) / steps.length) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function cityCodeToDefaultCountry(code) {
  const c = (code || "").toUpperCase();
  const map = {
    GB: "GB",
    UK: "GB",
    IE: "IE",
    US: "US",
    FR: "FR",
    DE: "DE",
    NL: "NL",
    AE: "AE",
    SG: "SG",
    AU: "AU",
    ES: "ES",
    IT: "IT",
    PT: "PT",
  };
  return map[c] || "GB";
}

export default function JobApplication() {
  const { slug } = useParams();
  const [pageStatus, setPageStatus] = useState("loading");
  const [jobError, setJobError] = useState("");
  const [job, setJob] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [submittedApp, setSubmittedApp] = useState(null);
  const [submittedJobTitle, setSubmittedJobTitle] = useState("");
  const [step, setStep] = useState(0);
  const [animateDir, setAnimateDir] = useState("next");
  const saveTimerRef = useRef(null);

  const savedDefaults = useMemo(() => {
    if (!slug) return null;
    const raw = sessionStorage.getItem(storageKey(slug));
    return raw ? safeJsonParse(raw, null) : null;
  }, [slug]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(applyFormSchema),
    defaultValues: {
      firstName: savedDefaults?.firstName || "",
      lastName: savedDefaults?.lastName || "",
      email: savedDefaults?.email || "",
      phone: savedDefaults?.phone || "",
      vehicleType: savedDefaults?.vehicleType || "",
      vehicleDetails: savedDefaults?.vehicleDetails || "",
      addressLine1: savedDefaults?.addressLine1 || "",
      addressLine2: savedDefaults?.addressLine2 || "",
      city: savedDefaults?.city || "",
      postcode: savedDefaults?.postcode || "",
      country: savedDefaults?.country || "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!slug) {
        setPageStatus("error");
        setJobError("Missing apply link.");
        return;
      }
      setPageStatus("loading");
      setJobError("");
      try {
        const res = await publicServices.getJobBySlug(slug);
        if (cancelled) return;
        if (res?.success && res.job) {
          setJob(res.job);
          setPageStatus("ready");
        } else {
          setPageStatus("error");
          setJobError("We could not load this job.");
        }
      } catch (err) {
        if (cancelled) return;
        setPageStatus("error");
        setJobError(
          err?.response?.data?.message ||
            err?.message ||
            "This apply link is not valid or has expired."
        );
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (job?.city?.country) {
      const existing = getValues("country");
      if (!existing) setValue("country", job.city.country);
    }
  }, [job, setValue, getValues]);

  useEffect(() => {
    if (!slug) return undefined;
    const sub = watch((values) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        sessionStorage.setItem(storageKey(slug), JSON.stringify(values || {}));
      }, 250);
    });
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      sub?.unsubscribe?.();
    };
  }, [slug, watch]);

  const onSubmit = async (values) => {
    setSubmitError("");
    const vehicleType = values.vehicleType?.trim();
    const payload = {
      jobSlug: slug,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      vehicleType: vehicleType || undefined,
      vehicleDetails: values.vehicleDetails?.trim() || undefined,
      addressLine1: values.addressLine1?.trim() || undefined,
      addressLine2: values.addressLine2?.trim() || undefined,
      city: values.city?.trim() || undefined,
      postcode: values.postcode?.trim() || undefined,
      country: values.country?.trim() || undefined,
      source: "job_portal",
    };
    try {
      const res = await publicServices.submitApplication(payload);
      if (res?.success && res.application) {
        setSubmittedApp(res.application);
        setSubmittedJobTitle(res.jobTitle || job?.title || "");
        if (slug) sessionStorage.removeItem(storageKey(slug));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (status === 409) {
        setSubmitError(
          "You have already applied for this position with this email."
        );
      } else if (status === 400) {
        setSubmitError(
          msg || "This position is no longer accepting applications."
        );
      } else {
        setSubmitError(
          msg || "Something went wrong. Please try again in a moment."
        );
      }
    }
  };

  if (pageStatus === "loading") {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-600">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          <p className="text-sm">Loading job…</p>
        </div>
      </PageLayout>
    );
  }

  if (pageStatus === "error") {
    return (
      <PageLayout>
        <div className="max-w-lg mx-auto mt-12 px-4">
          <Card className="border-rose-200 bg-rose-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-800 text-lg">
                <AlertCircle className="h-5 w-5 shrink-0" />
                Link not available
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-rose-900/90 space-y-2">
              <p>{jobError}</p>
              <p className="text-rose-800/80">
                If you were sent this link by mistake, please contact the hiring team.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (submittedApp) {
    return (
      <PageLayout>
        <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-900 text-xl">
                <CheckCircle2 className="h-7 w-7 text-emerald-600 shrink-0" />
                Application submitted successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-800">
              <p>
                Thank you{submittedJobTitle ? ` for applying to ${submittedJobTitle}` : ""}.
                You will receive an email with next steps.
              </p>
              <div className="rounded-lg bg-white/80 border border-emerald-100 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Application reference
                </p>
                <p className="text-lg font-mono font-semibold text-slate-900 mt-1">
                  #{submittedApp.id}
                </p>
              </div>
              <p className="text-slate-600">
                Our team will review your application. You can return to this site later to check
                your status and complete any follow-up steps.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const defaultCountry = cityCodeToDefaultCountry(job?.city?.cityCode);
  const steps = [
    { key: "personal", label: "Personal details", fields: ["firstName", "lastName", "email", "phone"] },
    { key: "details", label: "Vehicle & address", fields: ["vehicleType", "vehicleDetails", "addressLine1", "addressLine2", "city", "postcode", "country"] },
    { key: "review", label: "Review & submit", fields: [] },
  ];
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const goNext = async () => {
    const fields = steps[step]?.fields || [];
    const ok = fields.length ? await trigger(fields) : true;
    if (!ok) return;
    setAnimateDir("next");
    setStep((s) => Math.min(steps.length - 1, s + 1));
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  const goBack = () => {
    setAnimateDir("back");
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  const clearSaved = () => {
    if (!slug) return;
    sessionStorage.removeItem(storageKey(slug));
  };

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-10 space-y-8 pb-16">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-brand-blue">
            <Briefcase className="h-6 w-6" />
            <span className="text-sm font-semibold uppercase tracking-wide">Apply</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
            {job.title}
          </h1>
          {job.city && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 shrink-0" />
                {job.city.city} ({job.city.cityCode})
              </span>
              <span>
                {job.city.currencySymbol} {job.city.currency} · {job.city.timezone}
              </span>
            </p>
          )}
        </header>

        {job.description ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">About this role</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 whitespace-pre-wrap pt-0">
              {job.description}
            </CardContent>
          </Card>
        ) : null}

        {job.requirements ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Requirements</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 whitespace-pre-wrap pt-0">
              {job.requirements}
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Your application</CardTitle>
            <p className="text-sm text-slate-500 font-normal">
              Fields marked * are required. Use a phone number you can be reached on.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <ProgressSteps step={step} steps={steps} />
              {submitError ? (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
                >
                  {submitError}
                </div>
              ) : null}

              <div
                className={`transition-all ${prefersReducedMotion ? "" : "duration-200"} ${
                  animateDir === "next" ? "animate-[fadeIn_200ms_ease-out]" : "animate-[fadeIn_200ms_ease-out]"
                }`}
              >
                {step === 0 ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="firstName">First name *</Label>
                        <Input
                          id="firstName"
                          autoComplete="given-name"
                          {...register("firstName")}
                          className={errors.firstName ? "border-rose-500" : ""}
                        />
                        {errors.firstName && (
                          <p className="text-xs text-rose-600">{errors.firstName.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lastName">Last name *</Label>
                        <Input
                          id="lastName"
                          autoComplete="family-name"
                          {...register("lastName")}
                          className={errors.lastName ? "border-rose-500" : ""}
                        />
                        {errors.lastName && (
                          <p className="text-xs text-rose-600">{errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        {...register("email")}
                        className={errors.email ? "border-rose-500" : ""}
                      />
                      {errors.email && (
                        <p className="text-xs text-rose-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone *</Label>
                      <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => (
                          <PhoneInput
                            international
                            defaultCountry={defaultCountry}
                            value={field.value}
                            onChange={field.onChange}
                            className="phone-input-wrapper"
                            withCountryCallingCode
                            flagUrl="https://catamphetamine.github.io/country-flag-icons/3x2/{XX}.svg"
                            numberInputProps={{
                              id: "phone",
                              className: "phone-number-input w-full",
                              placeholder: "Phone number",
                            }}
                          />
                        )}
                      />
                      {errors.phone && (
                        <p className="text-xs text-rose-600">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="vehicleType">Vehicle type</Label>
                      <select
                        id="vehicleType"
                        {...register("vehicleType")}
                        className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {VEHICLE_OPTIONS.map((opt) => (
                          <option key={opt.value || "empty"} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="vehicleDetails">Vehicle details (make / model / year)</Label>
                      <Input
                        id="vehicleDetails"
                        placeholder="e.g. Ford Transit 2020"
                        {...register("vehicleDetails")}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="addressLine1">Address line 1</Label>
                      <Input id="addressLine1" autoComplete="address-line1" {...register("addressLine1")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="addressLine2">Address line 2</Label>
                      <Input id="addressLine2" autoComplete="address-line2" {...register("addressLine2")} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" autoComplete="address-level2" {...register("city")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="postcode">Postcode</Label>
                        <Input id="postcode" autoComplete="postal-code" {...register("postcode")} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" autoComplete="country-name" {...register("country")} />
                    </div>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-slate-50 p-4 text-sm">
                      <p className="font-semibold text-slate-900">Review your details</p>
                      <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <dt className="text-slate-500 text-xs">Name</dt>
                          <dd className="text-slate-900">{`${getValues("firstName")} ${getValues("lastName")}`.trim() || "-"}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500 text-xs">Email</dt>
                          <dd className="text-slate-900">{getValues("email") || "-"}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500 text-xs">Phone</dt>
                          <dd className="text-slate-900">{getValues("phone") || "-"}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500 text-xs">Vehicle</dt>
                          <dd className="text-slate-900">{getValues("vehicleType") || "-"}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-slate-500 text-xs">Address</dt>
                          <dd className="text-slate-900">
                            {[
                              getValues("addressLine1"),
                              getValues("addressLine2"),
                              getValues("city"),
                              getValues("postcode"),
                              getValues("country"),
                            ].filter(Boolean).join(", ") || "-"}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <Button
                      type="submit"
                      className="w-full sm:w-auto min-w-[200px] bg-brand-blue hover:bg-brand-shadeBlue"
                      disabled={isSubmitting}
                      onClick={() => {
                        // clear saved draft after successful submit (handled in onSubmit success)
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                          Submitting…
                        </>
                      ) : (
                        "Submit application"
                      )}
                    </Button>
                    <button
                      type="button"
                      className="text-xs text-slate-500 underline"
                      onClick={clearSaved}
                    >
                      Clear saved draft
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button type="button" variant="outline" onClick={goBack} disabled={step === 0 || isSubmitting}>
                  Back
                </Button>
                {step < steps.length - 1 ? (
                  <Button type="button" onClick={goNext} disabled={isSubmitting}>
                    Next
                  </Button>
                ) : (
                  <span className="text-xs text-slate-500">Ready to submit</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
