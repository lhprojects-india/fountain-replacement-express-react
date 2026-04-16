import { useEffect, useState } from "react";

const OfflineBanner = () => {
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      className="fixed top-0 inset-x-0 z-50 bg-amber-100 border-b border-amber-300 text-amber-900 text-sm px-4 py-2 text-center"
      role="status"
      aria-live="polite"
    >
      You&apos;re offline. Some features may be unavailable.
    </div>
  );
};

export default OfflineBanner;
