/**
 * AdminRoleBadge — presentational only.
 * Maps an admin role string to the Stitch-design badge style.
 * No logic, no API calls — just styling.
 */

const ROLE_MAP = {
  super_admin:  { label: 'Super Admin',  cls: 'adm-badge adm-role-super_admin' },
  app_admin:    { label: 'App Admin',    cls: 'adm-badge adm-role-app_admin'   },
  admin_fleet:  { label: 'Fleet Admin',  cls: 'adm-badge adm-role-admin_fleet' },
  admin_view:   { label: 'View Only',    cls: 'adm-badge adm-role-admin_view'  },
};

export function AdminRoleBadge({ role, className = '' }) {
  const cfg = ROLE_MAP[role] ?? ROLE_MAP.admin_view;
  return (
    <span className={`${cfg.cls} ${className}`}>
      {cfg.label}
    </span>
  );
}
