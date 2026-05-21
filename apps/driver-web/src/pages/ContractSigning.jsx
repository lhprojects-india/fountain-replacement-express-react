import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  PageLayout,
  useToast,
} from "@lh/shared";
import { ExternalLink, FileSignature, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { publicServices } from "../lib/public-services";

const ContractSigning = () => {
  const { toast } = useToast();
  const { application, loadDriverApplication } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [signingUrl, setSigningUrl] = useState(application?.contractSigningUrl || null);
  const [contractStatus, setContractStatus] = useState(application?.contractStatus || null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        if (application?.contractSigningUrl) {
          if (!active) return;
          setSigningUrl(application.contractSigningUrl);
          setContractStatus(application.contractStatus || null);
          return;
        }
        const result = await publicServices.getContractSigningUrl();
        if (!active) return;
        setSigningUrl(result?.signingUrl || null);
        setContractStatus(result?.contractStatus || null);
      } catch (error) {
        if (!active) return;
        setSigningUrl(null);
        setContractStatus(application?.contractStatus || null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [application?.contractSigningUrl, application?.contractStatus]);

  const handleResend = async () => {
    setResending(true);
    try {
      await publicServices.resendContract();
      await loadDriverApplication();
      toast({
        title: "Contract resent",
        description: `Check your inbox at ${application?.email || "your email"} for the signing link.`,
      });
    } catch (error) {
      toast({
        title: "Unable to resend contract",
        description: error?.response?.data?.message || "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const email = application?.email || "your email";

  return (
    <PageLayout title="Sign Your Contract">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-brand-blue" aria-hidden />
              Employment contract
            </CardTitle>
            <CardDescription>
              Review and sign your contract to continue onboarding. We also sent a copy to{" "}
              <span className="font-medium text-gray-800">{email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-gray-600">Loading your signing link…</p>
            ) : signingUrl ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                <p className="text-sm text-gray-700">
                  Your contract is ready. Open the signing page to review and sign electronically.
                </p>
                <Button asChild className="min-h-[44px] w-full sm:w-auto">
                  <a href={signingUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    Open contract to sign
                  </a>
                </Button>
                <p className="text-xs text-gray-500">
                  The signing page opens in a new tab. Return here when you are finished.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                <p className="text-sm text-amber-900 flex items-start gap-2">
                  <Mail className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                  <span>
                    Your signing link is not ready yet. Check your inbox at {email} (including spam),
                    or request a new email below.
                  </span>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px]"
                  disabled={resending}
                  onClick={handleResend}
                >
                  {resending ? "Sending…" : "Resend contract email"}
                </Button>
              </div>
            )}
            {contractStatus ? (
              <p className="text-xs text-gray-500">Current status: {contractStatus}</p>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-wrap items-center gap-3">
            <Link className="text-sm text-brand-blue hover:underline" to="/dashboard">
              Back to dashboard
            </Link>
          </CardFooter>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ContractSigning;
