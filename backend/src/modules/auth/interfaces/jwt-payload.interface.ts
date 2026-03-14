export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  companyId: number | null;
  permissions: string[];
  moduleAccess: string[];
}
