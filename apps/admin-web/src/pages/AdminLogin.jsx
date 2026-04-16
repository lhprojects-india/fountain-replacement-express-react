import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Button, Input, Label, ProductBrandHeading } from "@lh/shared";
import AppBrandMark from "../components/AppBrandMark";
import { Loader2 } from "lucide-react";

const EMAIL_DEV_LOGIN =
  import.meta.env.VITE_ENABLE_EMAIL_ADMIN_LOGIN === "true";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function AdminLogin() {
  const {
    signInWithGoogle,
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

  const handleGoogleSignIn = async () => {
    const success = await signInWithGoogle();
    if (success) {
      navigate('/', { replace: true });
    }
  };

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
                Welcome back. Please authenticate using your corporate account to access the orchestrator dashboard.
              </p>
            </div>

            {/* Google SSO button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full group relative flex items-center justify-center gap-4 py-4 px-6 rounded-xl transition-all duration-300 hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'var(--adm-surface-container-lowest)',
                border: '1px solid rgba(191,199,212,0.3)',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,94,161,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(191,199,212,0.3)'}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--adm-outline)' }} />
                ) : (
                  <GoogleIcon />
                )}
              </div>
              <span className="text-base font-semibold" style={{ color: 'var(--adm-on-surface)' }}>
                {isLoading ? 'Signing in…' : 'Sign in with Google'}
              </span>
              {/* Hover overlay */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: 'rgba(0,94,161,0.04)' }}
              />
            </button>

            {EMAIL_DEV_LOGIN && (
              <div
                className="mt-8 pt-8 space-y-4"
                style={{ borderTop: "1px solid var(--adm-surface-container)" }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide text-center"
                  style={{ color: "var(--adm-on-surface-variant)" }}
                >
                  Local development sign-in
                </p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="dev-admin-email" className="text-xs">
                      Email
                    </Label>
                    <Input
                      id="dev-admin-email"
                      type="email"
                      autoComplete="username"
                      value={devEmail}
                      onChange={(e) => setDevEmail(e.target.value)}
                      placeholder="dev-admin@localhost.test"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dev-admin-password" className="text-xs">
                      Password
                    </Label>
                    <Input
                      id="dev-admin-password"
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
                    Sign in with email (dev only)
                  </Button>
                </div>
              </div>
            )}

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
