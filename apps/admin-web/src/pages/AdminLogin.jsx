import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Button } from "@lh/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lh/shared";
import { Alert, AlertDescription } from "@lh/shared";
import { Loader2, ShieldCheck } from "lucide-react";
import { LaundryheapLogo } from "@lh/shared";

function GoogleIcon() {
  return (
    <svg
      className="mr-3 h-5 w-5"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function AdminLogin() {
  const { signInWithGoogle, isLoading, isAuthenticated, isAuthorized } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('admin-page');
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAuthorized) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, isAuthorized, navigate]);

  const handleGoogleSignIn = async () => {
    const success = await signInWithGoogle();
    if (success) {
      navigate('/admin', { replace: true });
    }
  };

  if (isAuthenticated && isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-blue" />
          <p className="text-gray-600">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-lightBlue via-brand-blue to-brand-shadeBlue py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <LaundryheapLogo />
          </div>
          <h2 className="text-3xl font-bold text-white">
            Laundryheap Admin
          </h2>
          <p className="mt-2 text-sm text-blue-100">
            Driver Onboarding Management System
          </p>
        </div>

        <Card className="shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-4 bg-gradient-to-r from-brand-lightBlue to-brand-lightTeal">
            <div className="flex justify-center mb-2">
              <ShieldCheck className="h-8 w-8 text-brand-shadeBlue" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">Admin Sign In</CardTitle>
            <CardDescription className="text-gray-700">
              Use your authorised Google account to access the admin panel
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6 pb-8">
            <Alert className="bg-brand-lightBlue border-2 border-brand-blue rounded-xl">
              <AlertDescription className="text-sm text-gray-800">
                <strong className="text-brand-shadeBlue">Restricted Access:</strong> Only authorised Laundryheap personnel can sign in.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-md hover:shadow-lg rounded-xl transition-all duration-200 flex items-center justify-center"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin text-gray-500" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span className="font-medium">Sign in with Google</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-xs text-blue-100">
            © 2025 Laundryheap · Driver Onboarding Admin Panel
          </p>
        </div>
      </div>
    </div>
  );
}
