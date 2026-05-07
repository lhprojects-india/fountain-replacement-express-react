import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Button, Input, Label, ProductBrandHeading } from "@lh/shared";
import AppBrandMark from "../components/AppBrandMark";
import { Loader2 } from "lucide-react";

export default function AdminLogin() {
  const {
    signInWithEmailPassword,
    isLoading,
    isAuthenticated,
    isAuthorized,
  } = useAdminAuth();
  const navigate = useNavigate();
  const [devEmail, setDevEmail] = useState(
    () => import.meta.env.VITE_DEV_ADMIN_EMAIL || ""
  );
  const [devPassword, setDevPassword] = useState("");

  useEffect(() => {
    document.body.classList.add('admin-page');
    return () => document.body.classList.remove('admin-page');
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAuthorized) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isAuthorized, navigate]);

  if (isAuthenticated && isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--adm-surface)' }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: 'var(--adm-primary)' }} />
          <p style={{ color: 'var(--adm-on-surface-variant)' }}>Redirecting to admin dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative isolate overflow-hidden"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div className="adm-login-bg absolute inset-0 -z-20" />
      {/* Background decorative blobs */}
      <div
        className="adm-bg-blob-primary"
        style={{ top: '10%', right: '15%' }}
      />
      <div
        className="adm-bg-blob-secondary"
        style={{ bottom: '10%', left: '10%' }}
      />

      <main className="w-full max-w-[480px]">
        {/* Brand logo area */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl mb-6 overflow-hidden"
            style={{ background: 'var(--adm-on-secondary-container)' }}
          >
            <AppBrandMark className="w-10 h-10" />
          </div>
          <div className="text-center">
            <ProductBrandHeading
              className="items-center mb-4"
              mainClassName="text-4xl font-bold tracking-tight text-[var(--adm-on-surface)]"
              bylineClassName="text-sm font-medium mt-2 text-[var(--adm-on-surface-variant)] opacity-80"
            />
            <p
              className="text-sm font-medium uppercase tracking-wide"
              style={{ color: 'var(--adm-on-surface-variant)', opacity: 0.7 }}
            >
              Admin portal
            </p>
          </div>
        </div>

        {/* Login card */}
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{
            background: 'var(--adm-surface-container-lowest)',
            boxShadow: '0 30px 60px -12px rgba(0,0,0,0.28)',
            border: '1px solid rgba(191,199,212,0.22)',
          }}
        >
          {/* Left accent sliver */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ background: 'linear-gradient(to bottom, var(--adm-primary), var(--adm-primary-container))' }}
          />

          <div className="p-10 md:p-12">
            <div className="mb-10 text-center">
              <p
                className="leading-relaxed"
                style={{ color: 'var(--adm-on-surface-variant)' }}
              >
                Welcome back. Sign in using your admin email and password.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="admin@laundryheap.com"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password" className="text-xs">
                  Password
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={devPassword}
                  onChange={(e) => setDevPassword(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button
                type="button"
                className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white"
                disabled={isLoading}
                onClick={async () => {
                  const ok = await signInWithEmailPassword(
                    devEmail,
                    devPassword
                  );
                  if (ok) navigate("/", { replace: true });
                }}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>

            {/* Footer links */}
            <div
              className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ borderTop: '1px solid var(--adm-surface-container)' }}
            >
              <a
                href="#"
                className="text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                style={{ color: 'var(--adm-outline)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--adm-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--adm-outline)'}
              >
                Help Center
              </a>
              <a
                href="#"
                className="text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                style={{ color: 'var(--adm-outline)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--adm-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--adm-outline)'}
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-xs font-medium tracking-tight" style={{ color: 'var(--adm-outline)', opacity: 0.6 }}>
            © {new Date().getFullYear()} Laundryheap Limited. All rights reserved.
            <span className="hidden sm:inline mx-2">•</span>
            Authorised Personnel Only.
          </p>
        </footer>
      </main>
    </div>
  );
}
