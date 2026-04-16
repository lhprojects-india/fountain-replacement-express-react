import { Link, NavLink, useLocation } from "react-router-dom";
import { useMemo } from "react";
import {
  BarChart3,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  MapPinned,
  PhoneCall,
  Settings,
  ShieldCheck,
  FileText,
  LayoutList,
  Layers,
  Users,
  ClipboardList,
} from "lucide-react";
import { Button, PRODUCT_DISPLAY_NAME, ProductBrandHeading } from "@lh/shared";
import AppBrandMark from "../AppBrandMark";

const mainNav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/pipeline", label: "Pipeline", icon: LayoutList, badgeKey: "pipeline" },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/calls", label: "Calls", icon: PhoneCall, badgeKey: "calls" },
  { to: "/analytics", label: "Stats", icon: BarChart3 },
];

const settingsNav = [
  { to: "/settings/cities", label: "Cities", icon: MapPinned },
  { to: "/settings/templates", label: "Templates", icon: FileText },
  { to: "/settings/questionnaires", label: "Questionnaires", icon: ClipboardList },
  { to: "/settings/fees", label: "Fee Structures", icon: Layers },
  { to: "/settings/facilities", label: "Facilities", icon: ShieldCheck },
  { to: "/settings/team", label: "Team", icon: Users },
];

function initials(nameOrEmail) {
  const parts = String(nameOrEmail || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return String(nameOrEmail || "A").slice(0, 2).toUpperCase();
}

export default function AdminSidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  counts = {},
  currentUser,
  adminRole,
  onSignOut,
}) {
  const location = useLocation();
  const isSettingsActive = useMemo(
    () => location.pathname.startsWith("/settings"),
    [location.pathname]
  );
  const containerClass = collapsed
    ? "w-[84px]"
    : "w-[280px]";

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onCloseMobile}
          aria-label="Close sidebar overlay"
        />
      ) : null}
      <aside
        className={`adm-sidebar-shell fixed top-0 left-0 z-40 h-screen ${containerClass} transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 border-b border-white/10 px-3 flex items-center justify-between gap-2 min-w-0">
            <Link
              to="/"
              className={`flex items-center gap-2 min-w-0 text-white ${collapsed ? "justify-center flex-1" : ""}`}
              aria-label={PRODUCT_DISPLAY_NAME}
            >
              <AppBrandMark className="h-9 w-9 shrink-0" />
              {!collapsed ? (
                <ProductBrandHeading
                  className="min-w-0"
                  mainClassName="font-semibold text-sm text-white truncate"
                  bylineClassName="text-[11px] font-normal text-indigo-100/85 leading-snug truncate mt-0.5"
                />
              ) : null}
            </Link>
            <button
              type="button"
              className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded border border-white/20 text-white hover:bg-white/10"
              onClick={onToggleCollapsed}
              aria-label="Toggle sidebar"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-5">
            <div className="space-y-1">
              {mainNav.map(({ to, label, icon: Icon, badgeKey }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onCloseMobile}
                  end={to === "/"}
                  className={({ isActive }) =>
                    `adm-sidebar-item flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                      isActive ? "adm-sidebar-item-active font-medium" : ""
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {!collapsed ? <span className="flex-1">{label}</span> : null}
                  {!collapsed && badgeKey && Number(counts[badgeKey] || 0) > 0 ? (
                    <span className="text-xs rounded-full bg-sky-500/20 text-sky-100 px-2 py-0.5">
                      {counts[badgeKey]}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>

            <div className="space-y-1">
              <div className={`px-3 text-xs text-indigo-100/70 uppercase tracking-wide ${collapsed ? "hidden" : "block"}`}>
                Setup
              </div>
              <NavLink
                to="/settings/cities"
                onClick={onCloseMobile}
                className={`adm-sidebar-item flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                  isSettingsActive ? "adm-sidebar-item-active font-medium" : ""
                }`}
              >
                <Settings className="h-4 w-4" />
                {!collapsed ? <span>Settings</span> : null}
              </NavLink>
              {collapsed ? (
                <div className="grid grid-cols-1 gap-1 pt-1">
                  {settingsNav.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={onCloseMobile}
                      title={label}
                      aria-label={label}
                      className={({ isActive }) =>
                        `adm-sidebar-item h-9 w-full inline-flex items-center justify-center rounded-md ${
                          isActive ? "adm-sidebar-item-active" : ""
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" />
                    </NavLink>
                  ))}
                </div>
              ) : null}
              {!collapsed ? (
                <div className="space-y-1 pl-8">
                  {settingsNav.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `adm-sidebar-item flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                          isActive ? "adm-sidebar-item-active" : ""
                        }`
                      }
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>

          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-3 rounded-md px-2 py-2 bg-white/8 border border-white/10">
              <div className="h-8 w-8 rounded-full bg-white text-indigo-700 flex items-center justify-center text-xs font-semibold">
                {initials(currentUser?.name || currentUser?.email)}
              </div>
              {!collapsed ? (
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {currentUser?.name || currentUser?.email || "Admin"}
                  </p>
                  <p className="text-xs text-indigo-100/70 truncate">{adminRole || "admin"}</p>
                </div>
              ) : null}
            </div>
            <Button
              variant="outline"
              className="w-full mt-2 justify-start border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {!collapsed ? "Sign out" : ""}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
