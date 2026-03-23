import { Request, Response, NextFunction } from 'express';
import { UserRole, DataScope, ExportFormat } from '../types';

// Role-to-DataScope mapping — the single source of truth for permissions
const ROLE_SCOPES: Record<UserRole, DataScope> = {
  [UserRole.RETAIL]: {
    timeRange: 'current_quarter',
    countries: 'limited',
    components: 'summary',
    exportFormats: ['csv'],
  },
  [UserRole.INSTITUTIONAL]: {
    timeRange: 'full_history',
    countries: 'all_38',
    components: 'full_breakdown',
    exportFormats: ['csv', 'json'],
  },
  [UserRole.ENTERPRISE]: {
    timeRange: 'full_history',
    countries: 'all_38',
    components: 'custom',
    exportFormats: ['csv', 'json', 'all'],
  },
  [UserRole.ADMIN]: {
    timeRange: 'full_history',
    countries: 'all_38',
    components: 'custom',
    exportFormats: ['csv', 'json', 'all'],
  },
};

export function getDataScope(role: UserRole): DataScope {
  return ROLE_SCOPES[role];
}

export function canExport(role: UserRole, format: ExportFormat): boolean {
  const scope = getDataScope(role);
  if (scope.exportFormats.includes('all')) return true;
  return scope.exportFormats.includes(format);
}

/**
 * Middleware factory: restrict route to specific roles
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'You do not have permission to access this resource.' });
      return;
    }

    next();
  };
}

/**
 * Middleware: require Admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }

  next();
}
