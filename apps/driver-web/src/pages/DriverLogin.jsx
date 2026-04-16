import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Input, PageLayout, useToast } from "@lh/shared";
import { useAuth } from "../context/AuthContext";

function clampInt(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function OtpInput({ value, onChange, disabled }) {
  const inputsRef = useRef([]);
  const digits = useMemo(() => {
    const clean = String(value || "").replace(/\D/g, "").slice(0, 6);
    return Array.from({ length: 6 }, (_, i) => clean[i] || "");
  }, [value]);

  const focusIndex = (idx) => {
    const el = inputsRef.current[idx];
    if (el) el.focus();
  };

  return (
    <div className="flex gap-2 justify-center" aria-label="One-time password input">
      {digits.map((d, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label={`Digit ${idx + 1}`}
          className="h-12 w-11 rounded-lg border text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-brand-blue"
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (!v) {
              const next = digits.map((x, i) => (i === idx ? "" : x)).join("");
              onChange(next);
              return;
            }
            const first = v[0];
            const next = digits.map((x, i) => (i === idx ? first : x)).join("");
            onChange(next);
            if (idx < 5) focusIndex(idx + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[idx] && idx > 0) focusIndex(idx - 1);
            if (e.key === "ArrowLeft" && idx > 0) focusIndex(idx - 1);
            if (e.key === "ArrowRight" && idx < 5) focusIndex(idx + 1);
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text") || "";
            const clean = text.replace(/\D/g, "").slice(0, 6);
            if (!clean) return;
            e.preventDefault();
            onChange(clean);
            focusIndex(Math.min(5, clean.length - 1));
          }}
        />
      ))}
    </div>
  );
}

const DriverLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { requestCode, verifyCode, isLoading } = useAuth();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const emailRef = useRef(null);

  const onRequestCode = async (e) => {
    e.preventDefault();
    try {
      if (!isLikelyEmail(email)) {
        toast({
          title: "Enter a valid email",
          description: "Please check your email address and try again.",
          variant: "destructive",
        });
        return;
      }
      const sendResult = await requestCode(email);
      toast({
        title: "Verification code sent",
        description: sendResult?.devOtp
          ? `Local dev: your code is ${sendResult.devOtp}. (Also check the backend terminal; email only works when Resend is configured.)`
          : "We sent a verification code to your email.",
      });
      setStep("code");
      setCooldown(60);
    } catch (error) {
      toast({
        title: "Unable to send code",
        description:
          error?.message === "No application found."
            ? "No application found. Please apply first."
            : error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const onVerifyCode = async (e) => {
    e.preventDefault();
    try {
      await verifyCode(email, code);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast({
        title: "Invalid code",
        description: error?.message || "Invalid or expired code.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (step === "email") {
      setCode("");
      setCooldown(0);
      setTimeout(() => emailRef.current?.focus?.(), 50);
    }
  }, [step]);

  useEffect(() => {
    if (searchParams.get("expired") === "1") {
      toast({
        title: "Session expired",
        description: "Please log in again to continue.",
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((s) => clampInt(s - 1, 0, 60)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  return (
    <PageLayout title="Driver Login">
      <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-sm space-y-4">
        <h1 className="text-2xl font-semibold text-brand-shadeBlue">Driver Login</h1>
        {step === "email" ? (
          <form onSubmit={onRequestCode} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                ref={emailRef}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-12 text-base"
              />
            </div>
            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Verification Code"}
            </Button>
            <p className="text-sm text-gray-600">
              No application yet? <Link className="touch-target inline-flex items-center text-brand-blue underline" to="/">Go to apply link</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={onVerifyCode} className="space-y-4">
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm font-medium text-slate-900">Enter the 6-digit code</p>
                <p className="text-xs text-slate-500 mt-1">
                  Sent to <span className="font-medium">{email}</span>
                </p>
              </div>
              <OtpInput
                value={code}
                onChange={(next) => setCode(String(next || "").replace(/\D/g, "").slice(0, 6))}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full h-12" disabled={isLoading || String(code).length !== 6}>
              {isLoading ? "Verifying..." : "Verify & Continue"}
            </Button>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="touch-target inline-flex items-center text-sm text-brand-blue underline"
                onClick={() => setStep("email")}
              >
                Use a different email
              </button>
              <button
                type="button"
                className="touch-target inline-flex items-center text-sm text-brand-blue underline disabled:opacity-50"
                disabled={cooldown > 0 || isLoading}
                onClick={async () => {
                  try {
                    await requestCode(email);
                    toast({ title: "Code resent", description: "Check your email for the new code." });
                    setCooldown(60);
                  } catch (error) {
                    toast({
                      title: "Unable to resend",
                      description: error?.message || "Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}
      </div>
    </PageLayout>
  );
};

export default DriverLogin;
