import { Loader2 } from "lucide-react";

const GlobalLoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3" aria-live="polite">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
        </div>
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </div>
  );
};

export default GlobalLoadingScreen;
