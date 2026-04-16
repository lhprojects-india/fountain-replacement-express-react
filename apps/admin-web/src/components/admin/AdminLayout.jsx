import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Menu, Search } from "lucide-react";
import { Button, PRODUCT_DISPLAY_NAME, ProductBrandHeading } from "@lh/shared";
import { useAdminAuth } from "../../context/AdminAuthContext";
import AdminSidebar from "./AdminSidebar";
import AppBrandMark from "../AppBrandMark";

function useLocalStorageState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  });
  const update = (next) => {
    const resolved = typeof next === "function" ? next(value) : next;
    setValue(resolved);
    localStorage.setItem(key, JSON.stringify(resolved));
  };
  return [value, update];
}

export default function AdminLayout({ children, counts = {} }) {
  const { currentUser, adminRole, signOut } = useAdminAuth();
  const [collapsed, setCollapsed] = useLocalStorageState("adminSidebarCollapsed", false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const countsMemo = useMemo(() => counts || {}, [counts]);

  useEffect(() => {
    document.body.classList.add("admin-page");
    return () => document.body.classList.remove("admin-page");
  }, []);

  return (
    <div className="admin-shell min-h-screen bg-slate-50">
      <AdminSidebar
        collapsed={Boolean(collapsed)}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        counts={countsMemo}
        currentUser={currentUser}
        adminRole={adminRole}
        onSignOut={async () => {
          await signOut();
          window.location.assign("/login");
        }}
      />
      <div className={`${collapsed ? "lg:ml-[84px]" : "lg:ml-[280px]"} transition-all`}>
        <header className="adm-topbar h-16 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 gap-3">
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <Link
              to="/"
              className="flex items-center gap-2 min-w-0 lg:hidden"
              aria-label={PRODUCT_DISPLAY_NAME}
            >
              <AppBrandMark className="h-8 w-8 shrink-0" />
              <ProductBrandHeading
                className="min-w-0 max-w-[11rem] sm:max-w-xs"
                mainClassName="font-semibold text-sm text-slate-800 truncate"
                bylineClassName="text-[11px] text-slate-500 truncate mt-0.5"
              />
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-2 w-full max-w-md ml-0 lg:ml-0 flex-1 min-w-0">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="adm-search w-full px-3 text-sm outline-none"
              placeholder="Search applications, candidates..."
              aria-label="Search"
            />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              className="h-9 w-9 rounded-full border border-slate-200 text-slate-600 inline-flex items-center justify-center bg-white hover:bg-slate-50"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
            <div className="text-sm text-slate-500">{new Date().toLocaleDateString()}</div>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
