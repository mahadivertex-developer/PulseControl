export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: string;
    companyId: number | null;
    companyName: string | null;
    permissions: string[];
    moduleAccess: string[];
  };
}

export interface SessionContextResponse {
  userId: number;
  email: string;
  role: string;
  scope: 'system' | 'tenant';
  companyId: number | null;
  permissions: string[];
  moduleAccess: string[];
}

export interface CurrentUserResponse {
  id: number;
  email: string;
  role: string;
  companyId: number | null;
  permissions: string[];
  moduleAccess: string[];
}
