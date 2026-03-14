const AUTH_TOKEN_KEY = 'authToken';
const USER_EMAIL_KEY = 'userEmail';
const USER_ROLE_KEY = 'userRole';
const USER_COMPANY_ID_KEY = 'userCompanyId';
const USER_MODULE_ACCESS_KEY = 'userModuleAccess';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
  setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },
  clearToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },
  getUserEmail(): string | null {
    return localStorage.getItem(USER_EMAIL_KEY);
  },
  setUserEmail(email: string): void {
    localStorage.setItem(USER_EMAIL_KEY, email);
  },
  clearUserEmail(): void {
    localStorage.removeItem(USER_EMAIL_KEY);
  },
  getUserRole(): string | null {
    return localStorage.getItem(USER_ROLE_KEY);
  },
  setUserRole(role: string): void {
    localStorage.setItem(USER_ROLE_KEY, role);
  },
  clearUserRole(): void {
    localStorage.removeItem(USER_ROLE_KEY);
  },
  getUserCompanyId(): number | null {
    const value = localStorage.getItem(USER_COMPANY_ID_KEY);
    if (value === null || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  },
  setUserCompanyId(companyId: number | null): void {
    if (companyId === null || companyId === undefined) {
      localStorage.setItem(USER_COMPANY_ID_KEY, '');
      return;
    }
    localStorage.setItem(USER_COMPANY_ID_KEY, String(companyId));
  },
  clearUserCompanyId(): void {
    localStorage.removeItem(USER_COMPANY_ID_KEY);
  },
  getUserModuleAccess(): string[] {
    const raw = localStorage.getItem(USER_MODULE_ACCESS_KEY);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  setUserModuleAccess(moduleAccess: string[]): void {
    localStorage.setItem(USER_MODULE_ACCESS_KEY, JSON.stringify(moduleAccess));
  },
  clearUserModuleAccess(): void {
    localStorage.removeItem(USER_MODULE_ACCESS_KEY);
  },
  clear(): void {
    this.clearToken();
    this.clearUserEmail();
    this.clearUserRole();
    this.clearUserCompanyId();
    this.clearUserModuleAccess();
  },
};
