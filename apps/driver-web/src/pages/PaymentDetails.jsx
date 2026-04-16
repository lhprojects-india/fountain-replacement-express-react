import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, PageLayout, useToast } from "@lh/shared";
import DynamicFormField from "../components/DynamicFormField";
import { publicServices } from "../lib/public-services";
import { useAuth } from "../context/AuthContext";

const PaymentDetails = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loadDriverApplication } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [schema, setSchema] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [schemaResult, paymentResult] = await Promise.all([
          publicServices.getPaymentSchema(),
          publicServices.getPaymentDetails(),
        ]);
        if (!active) return;
        const nextSchema = schemaResult?.schema || { fields: [] };
        setSchema(nextSchema);
        const existing = paymentResult?.payment?.details || {};
        const initial = {};
        for (const field of nextSchema.fields || []) {
          const val = existing[field.key];
          initial[field.key] = val == null ? "" : String(val);
        }
        setValues(initial);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const validate = () => {
    const nextErrors = {};
    for (const field of schema?.fields || []) {
      const value = String(values[field.key] ?? "");
      if (field.required && !value.trim()) {
        nextErrors[field.key] = `${field.label} is required`;
        continue;
      }
      if (value && field.pattern) {
        const re = new RegExp(field.pattern);
        if (!re.test(value)) {
          nextErrors[field.key] = field.patternMessage || `Invalid format for ${field.label}`;
        }
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await publicServices.submitPaymentDetails(values);
      await loadDriverApplication();
      toast({
        title: "Payment details submitted successfully!",
        description: "Your onboarding call will be scheduled.",
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const apiErrors = error?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") {
        setErrors(apiErrors);
      }
      toast({
        title: "Submission failed",
        description: error?.response?.data?.message || "Unable to submit payment details.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout title="Payment Details">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
            <CardDescription>
              Please provide your payment details. These will be used to pay you for completed shifts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-gray-600">Loading payment fields...</p>
            ) : (
              (schema?.fields || []).map((field) => (
                <DynamicFormField
                  key={field.key}
                  field={field}
                  value={values[field.key]}
                  error={errors[field.key]}
                  onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
                />
              ))
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSubmit} disabled={loading || submitting}>
              {submitting ? "Submitting..." : "Submit Payment Details"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageLayout>
  );
};

export default PaymentDetails;
