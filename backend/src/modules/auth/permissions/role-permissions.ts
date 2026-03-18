export const PERMISSIONS_KEY = 'permissions';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['users.read', 'users.write', 'companies.read', 'companies.write', 'company-data.read', 'company-data.write', 'session.read'],
  system_admin: ['users.read', 'users.write', 'companies.read', 'companies.write', 'company-data.read', 'company-data.write', 'session.read'],
  company_admin: ['users.read', 'users.write', 'companies.read', 'company-data.read', 'company-data.write', 'session.read'],
  manager: ['users.read', 'companies.read', 'company-data.read', 'session.read'],
  user: ['companies.read', 'company-data.read', 'session.read'],
};

export function getPermissionsForRole(role: string): string[] {
  const normalizedRole = role.trim().toLowerCase();
  return ROLE_PERMISSIONS[normalizedRole] ?? ['session.read'];
}

export function isSystemRole(role: string): boolean {
  const normalizedRole = role.trim().toLowerCase();
  return normalizedRole === 'admin' || normalizedRole === 'system_admin';
}
