/**
 * AdminStatusBadge — presentational only.
 * Maps an application recruitment status to the Stitch-design badge style.
 * No logic, no API calls — just styling.
 */

const STATUS_MAP = {
  pending:   { label: 'Pending',   cls: 'adm-badge adm-badge-pending'   },
  on_hold:   { label: 'On Hold',   cls: 'adm-badge adm-badge-on_hold'   },
  approved:  { label: 'Approved',  cls: 'adm-badge adm-badge-approved'  },
  hired:     { label: 'Hired',     cls: 'adm-badge adm-badge-hired'     },
  completed: { label: 'Completed', cls: 'adm-badge adm-badge-completed' },
  rejected:  { label: 'Rejected',  cls: 'adm-badge adm-badge-rejected'  },
};

export function AdminStatusBadge({ status, className = '' }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span className={`${cfg.cls} ${className}`}>
      {cfg.label}
    </span>
  );
}
