import prisma from '../../lib/prisma.js';
import { ForbiddenError } from '../../lib/errors.js';

/**
 * Authorize using the Admin row role (JWT only carries role: "admin").
 * @param {string[]} allowedRoles
 */
export function requireDbAdminRoles(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const email = req.user?.email;
      if (!email) {
        return next(new ForbiddenError('Unauthorized'));
      }
      const admin = await prisma.admin.findUnique({ where: { email } });
      if (!admin) {
        return next(new ForbiddenError('Admin not found'));
      }
      if (!allowedRoles.includes(admin.role)) {
        return next(new ForbiddenError('Insufficient permissions'));
      }
      req.dbAdmin = admin;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

export const REGION_CREATE_ROLES = ['super_admin', 'app_admin'];
export const REGION_DELETE_ROLES = ['super_admin'];
/** Any admin that can edit operational data (not read-only). */
export const REGION_MUTATE_ROLES = ['super_admin', 'app_admin', 'admin_fleet', 'admin'];

const ACTION_PERMISSIONS = {
  manage_regions: ['super_admin', 'app_admin'],
  manage_jobs: ['super_admin', 'app_admin'],
  manage_admins: ['super_admin', 'app_admin'],
  transition_applications: ['super_admin', 'app_admin', 'admin_fleet'],
  manage_facilities: ['super_admin', 'app_admin', 'admin_fleet'],
  view_applications: ['super_admin', 'app_admin', 'admin_fleet', 'admin_view', 'admin'],
  view_analytics: ['super_admin', 'app_admin', 'admin_fleet', 'admin_view', 'admin'],
  export_data: ['super_admin', 'app_admin', 'admin_fleet'],
};

export function hasPermission(adminRole, action) {
  const allowed = ACTION_PERMISSIONS[action] || [];
  return allowed.includes(adminRole);
}
