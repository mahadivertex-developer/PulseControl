export const PERMISSIONS_KEY = 'permissions';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['users.read', 'users.write', 'companies.read', 'companies.write', 'session.read'],
  system_admin: ['users.read', 'users.write', 'companies.read', 'companies.write', 'session.read'],
  company_admin: ['users.read', 'users.write', 'companies.read', 'session.read'],
  manager: ['users.read', 'companies.read', 'session.read'],
  user: ['companies.read', 'session.read'],
};

export function getPermissionsForRole(role: string): string[] {
  const normalizedRole = role.trim().toLowerCase();
  return ROLE_PERMISSIONS[normalizedRole] ?? ['session.read'];
}

export function isSystemRole(role: string): boolean {
  const normalizedRole = role.trim().toLowerCase();
  return normalizedRole === 'admin' || normalizedRole === 'system_admin';
}
