import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { Alert, AppBar, Box, Button, Container, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import { CompanyManagementPage } from '../modules/system-admin/CompanyManagementPage';
import { UserManagementPage } from '../modules/system-admin/UserManagementPage';
import {
  CompanySortBy,
  CompanySortOrder,
  CompanySummary,
  CreateCompanyPayload,
  UpdateCompanyPayload,
} from '../shared/types/companies';
import { CreateUserPayload, SortBy, SortOrder, UpdateUserPayload, UserSummary } from '../shared/types/users';

interface AdminDashboardProps {
  userEmail: string | null;
  currentUserCompanyId: number | null;
  currentUserRole: string;
  companies: CompanySummary[];
  companiesLoading: boolean;
  companyMessage: string | null;
  newCompany: CreateCompanyPayload;
  totalCompanies: number;
  companyPage: number;
  companyRowsPerPage: number;
  companySearchInput: string;
  companySortBy: CompanySortBy;
  companySortOrder: CompanySortOrder;
  users: UserSummary[];
  usersLoading: boolean;
  adminMessage: string | null;
  newUser: CreateUserPayload;
  totalUsers: number;
  page: number;
  rowsPerPage: number;
  searchInput: string;
  selectedCompanyId: number | null;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onLogout: () => void;
  onRefresh: () => void;
  onRefreshCompanies: () => void;
  onSearchInputChange: (value: string) => void;
  onCompanyFilterChange: (companyId: number | null) => void;
  onSearchSubmit: (event: FormEvent) => void;
  onClearSearch: () => void;
  onCompanySearchInputChange: (value: string) => void;
  onCompanySearchSubmit: (event: FormEvent) => void;
  onClearCompanySearch: () => void;
  onNewCompanyChange: (value: CreateCompanyPayload) => void;
  onCreateCompany: (event: FormEvent) => void;
  onUpdateCompany: (id: number, payload: UpdateCompanyPayload) => void;
  onNewUserChange: (value: CreateUserPayload) => void;
  onCreateUser: (event: FormEvent) => void;
  onUpdateUser: (id: number, payload: UpdateUserPayload) => void;
  onResetUserPassword: (id: number, newPassword: string) => void;
  onToggleCompany: (id: number, active: boolean) => void;
  onToggleUser: (id: number, active: boolean) => void;
  onPageChange: (_event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSortByChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSortOrderChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCompanyPageChange: (_event: unknown, newPage: number) => void;
  onCompanyRowsPerPageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCompanySortByChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCompanySortOrderChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function AdminDashboard(props: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            PulseControlERP
          </Typography>
          <Button color="inherit" onClick={props.onLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          Welcome! Logged in as {props.userEmail}
        </Alert>

        <Tabs value={activeTab} onChange={(_event, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Companies" />
          <Tab label="Users" />
        </Tabs>

        {activeTab === 0 ? (
          <CompanyManagementPage
            companies={props.companies}
            companiesLoading={props.companiesLoading}
            companyMessage={props.companyMessage}
            newCompany={props.newCompany}
            totalCompanies={props.totalCompanies}
            page={props.companyPage}
            rowsPerPage={props.companyRowsPerPage}
            searchInput={props.companySearchInput}
            sortBy={props.companySortBy}
            sortOrder={props.companySortOrder}
            onRefresh={props.onRefreshCompanies}
            onSearchInputChange={props.onCompanySearchInputChange}
            onSearchSubmit={props.onCompanySearchSubmit}
            onClearSearch={props.onClearCompanySearch}
            onNewCompanyChange={props.onNewCompanyChange}
            onCreateCompany={props.onCreateCompany}
            onUpdateCompany={props.onUpdateCompany}
            onToggleCompany={props.onToggleCompany}
            onPageChange={props.onCompanyPageChange}
            onRowsPerPageChange={props.onCompanyRowsPerPageChange}
            onSortByChange={props.onCompanySortByChange}
            onSortOrderChange={props.onCompanySortOrderChange}
          />
        ) : (
          <UserManagementPage
            companies={props.companies}
            users={props.users}
            usersLoading={props.usersLoading}
            adminMessage={props.adminMessage}
            newUser={props.newUser}
            totalUsers={props.totalUsers}
            page={props.page}
            rowsPerPage={props.rowsPerPage}
            searchInput={props.searchInput}
            selectedCompanyId={props.selectedCompanyId}
            sortBy={props.sortBy}
            sortOrder={props.sortOrder}
            currentUserEmail={props.userEmail}
            currentUserCompanyId={props.currentUserCompanyId}
            currentUserRole={props.currentUserRole}
            onRefresh={props.onRefresh}
            onSearchInputChange={props.onSearchInputChange}
            onCompanyFilterChange={props.onCompanyFilterChange}
            onSearchSubmit={props.onSearchSubmit}
            onClearSearch={props.onClearSearch}
            onNewUserChange={props.onNewUserChange}
            onCreateUser={props.onCreateUser}
            onUpdateUser={props.onUpdateUser}
            onToggleUser={props.onToggleUser}
            onResetUserPassword={props.onResetUserPassword}
            onPageChange={props.onPageChange}
            onRowsPerPageChange={props.onRowsPerPageChange}
            onSortByChange={props.onSortByChange}
            onSortOrderChange={props.onSortOrderChange}
          />
        )}
      </Container>
    </Box>
  );
}
