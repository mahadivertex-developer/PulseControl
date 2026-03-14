export interface CreateUserPayload {
  email?: string;
  userId?: string;
  password: string;
  role: string;
  companyId?: number;
  moduleAccess?: string[];
  fullName?: string;
  phoneNumber?: string;
  userCategory?: 'qa' | 'general';
  generalCategory?: string;
  userType?: 'executive' | 'management';
}

export interface UpdateUserPayload {
  email?: string;
  role?: string;
  companyId?: number;
  moduleAccess?: string[];
  fullName?: string;
  phoneNumber?: string;
  userCategory?: 'qa' | 'general';
  generalCategory?: string;
  userType?: 'executive' | 'management';
}

export interface UserSummary {
  id: number;
  email: string;
  userId?: string | null;
  fullName?: string | null;
  phoneNumber?: string | null;
  userCategory?: 'qa' | 'general' | null;
  generalCategory?: string | null;
  userType?: 'executive' | 'management' | null;
  role: string;
  isActive: boolean;
  companyId: number | null;
  companyName: string | null;
  moduleAccess?: string[];
  createdAt: string;
}

export interface UsersResponse {
  items: UserSummary[];
  total: number;
  page: number;
  limit: number;
  companyId?: number;
}

export type SortBy = 'id' | 'email' | 'role' | 'company' | 'status' | 'createdAt';
export type SortOrder = 'asc' | 'desc';
