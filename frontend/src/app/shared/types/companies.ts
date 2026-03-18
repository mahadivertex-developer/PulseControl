export interface CreateCompanyPayload {
  code: string;
  name: string;
  validityDate: string;
}

export interface UpdateCompanyPayload {
  code?: string;
  name?: string;
  validityDate?: string;
}

export interface CompanySummary {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  validityDate?: string | null;
  createdAt: string;
}

export interface CompaniesResponse {
  items: CompanySummary[];
  total: number;
  page: number;
  limit: number;
}

export type CompanySortBy = 'id' | 'code' | 'name' | 'status' | 'createdAt';
export type CompanySortOrder = 'asc' | 'desc';
