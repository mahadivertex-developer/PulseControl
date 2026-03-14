export interface CreateCompanyPayload {
  code: string;
  name: string;
}

export interface UpdateCompanyPayload {
  code?: string;
  name?: string;
}

export interface CompanySummary {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
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
