import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../shared/services/api';
import { authStorage } from '../shared/services/authStorage';
import { LoginPage } from '../auth/LoginPage';
import { RoleBasedWorkspace } from '../dashboard/RoleBasedWorkspace';
import { LandingPage } from '../landing/LandingPage';
import { CurrentUserResponse, LoginCredentials, LoginResponse } from '../shared/types/auth';
import {
  CreateUserPayload,
  SortBy,
  SortOrder,
  UpdateUserPayload,
  UserSummary,
  UsersResponse,
} from '../shared/types/users';
import {
  CompaniesResponse,
  CompanySortBy,
  CompanySortOrder,
  CompanySummary,
  CreateCompanyPayload,
  UpdateCompanyPayload,
} from '../shared/types/companies';

export function AppShell() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [currentRole, setCurrentRole] = useState<string>('user');
  const [currentCompanyId, setCurrentCompanyId] = useState<number | null>(null);
  const [currentModuleAccess, setCurrentModuleAccess] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [companyMessage, setCompanyMessage] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<LoginCredentials>({ email: '', password: '' });
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [companyPage, setCompanyPage] = useState(0);
  const [companyRowsPerPage, setCompanyRowsPerPage] = useState(10);
  const [companySearchInput, setCompanySearchInput] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [companySortBy, setCompanySortBy] = useState<CompanySortBy>('id');
  const [companySortOrder, setCompanySortOrder] = useState<CompanySortOrder>('asc');
  const [newUser, setNewUser] = useState<CreateUserPayload>({
    email: '',
    password: '',
    role: 'user',
    companyId: undefined,
    moduleAccess: [],
  });
  const [newCompany, setNewCompany] = useState<CreateCompanyPayload>({
    code: '',
    name: '',
  });

  useEffect(() => {
    const bootstrapSession = async () => {
      const token = authStorage.getToken();
      if (!token) {
        return;
      }

      try {
        const response = await apiClient.get<CurrentUserResponse>('/auth/me');
        authStorage.setUserEmail(response.data.email);
        authStorage.setUserRole(response.data.role);
        authStorage.setUserCompanyId(response.data.companyId);
        authStorage.setUserModuleAccess(response.data.moduleAccess || []);
        setCurrentRole(response.data.role);
        setCurrentCompanyId(response.data.companyId);
        setCurrentModuleAccess(response.data.moduleAccess || []);
        setIsLoggedIn(true);
      } catch {
        authStorage.clear();
        setIsLoggedIn(false);
      }
    };

    void bootstrapSession();
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setAdminMessage(null);
    try {
      const response = await apiClient.get<UsersResponse>('/auth/users', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search,
          sortBy,
          sortOrder,
          companyId: selectedCompanyId ?? undefined,
        },
      });
      setUsers(response.data.items);
      setTotalUsers(response.data.total);
    } catch (err: any) {
      setAdminMessage(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  }, [page, rowsPerPage, search, sortBy, sortOrder, selectedCompanyId]);

  const fetchCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    setCompanyMessage(null);
    try {
      const response = await apiClient.get<CompaniesResponse>('/companies', {
        params: {
          page: companyPage + 1,
          limit: companyRowsPerPage,
          search: companySearch,
          sortBy: companySortBy,
          sortOrder: companySortOrder,
        },
      });
      setCompanies(response.data.items);
      setTotalCompanies(response.data.total);
    } catch (err: any) {
      setCompanyMessage(err.response?.data?.message || 'Failed to load companies.');
    } finally {
      setCompaniesLoading(false);
    }
  }, [companyPage, companyRowsPerPage, companySearch, companySortBy, companySortOrder]);

  useEffect(() => {
    if (isLoggedIn) {
      void fetchUsers();
      void fetchCompanies();
    }
  }, [isLoggedIn, fetchUsers, fetchCompanies]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      authStorage.setToken(response.data.token);
      authStorage.setUserEmail(response.data.user.email);
      authStorage.setUserRole(response.data.user.role);
      authStorage.setUserCompanyId(response.data.user.companyId);
      authStorage.setUserModuleAccess(response.data.user.moduleAccess || []);
      setCurrentRole(response.data.user.role);
      setCurrentCompanyId(response.data.user.companyId);
      setCurrentModuleAccess(response.data.user.moduleAccess || []);
      setIsLoggedIn(true);
      setCredentials({ email: '', password: '' });
      setShowLogin(false);
      setAdminMessage('Login successful. User management loaded.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (event: FormEvent) => {
    event.preventDefault();
    setUsersLoading(true);
    setAdminMessage(null);

    try {
      await apiClient.post('/auth/register', newUser);
      setNewUser({ email: '', password: '', role: 'user', companyId: currentCompanyId ?? undefined, moduleAccess: [] });
      setAdminMessage('User created successfully.');
      await fetchUsers();
    } catch (err: any) {
      setAdminMessage(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCompanySystemAdminCreateUser = async (payload: CreateUserPayload) => {
    setUsersLoading(true);
    setAdminMessage(null);
    try {
      await apiClient.post('/auth/register', payload);
      setAdminMessage('User created successfully.');
      await fetchUsers();
    } catch (err: any) {
      setAdminMessage(err.response?.data?.message || 'Failed to create user.');
      throw err;
    } finally {
      setUsersLoading(false);
    }
  };

  const handleToggleUser = async (id: number, active: boolean) => {
    setUsersLoading(true);
    setAdminMessage(null);
    try {
      const route = active ? 'deactivate' : 'activate';
      await apiClient.patch(
        `/auth/users/${id}/${route}`,
        {},
      );
      setAdminMessage(`User ${active ? 'deactivated' : 'activated'} successfully.`);
      await fetchUsers();
    } catch (err: any) {
      setAdminMessage(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleResetUserPassword = async (id: number, newPassword: string) => {
    setUsersLoading(true);
    setAdminMessage(null);
    try {
      await apiClient.patch(`/auth/users/${id}/reset-password`, { newPassword });
      setAdminMessage('Password reset successfully.');
      await fetchUsers();
    } catch (err: any) {
      setAdminMessage(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUpdateUser = async (id: number, payload: UpdateUserPayload) => {
    setUsersLoading(true);
    setAdminMessage(null);
    try {
      await apiClient.patch(`/auth/users/${id}`, payload);
      setAdminMessage('User updated successfully.');
      await fetchUsers();
    } catch (err: any) {
      setAdminMessage(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreateCompany = async (event: FormEvent) => {
    event.preventDefault();
    setCompaniesLoading(true);
    setCompanyMessage(null);

    try {
      await apiClient.post('/companies', newCompany);
      setNewCompany({ code: '', name: '' });
      setCompanyMessage('Company created successfully.');
      await fetchCompanies();
    } catch (err: any) {
      setCompanyMessage(err.response?.data?.message || 'Failed to create company.');
    } finally {
      setCompaniesLoading(false);
    }
  };

  const handleToggleCompany = async (id: number, active: boolean) => {
    setCompaniesLoading(true);
    setCompanyMessage(null);
    try {
      const route = active ? 'deactivate' : 'activate';
      await apiClient.patch(
        `/companies/${id}/${route}`,
        {},
      );
      setCompanyMessage(`Company ${active ? 'deactivated' : 'activated'} successfully.`);
      await fetchCompanies();
    } catch (err: any) {
      setCompanyMessage(err.response?.data?.message || 'Failed to update company status.');
    } finally {
      setCompaniesLoading(false);
    }
  };

  const handleUpdateCompany = async (id: number, payload: UpdateCompanyPayload) => {
    setCompaniesLoading(true);
    setCompanyMessage(null);
    try {
      await apiClient.patch(`/companies/${id}`, payload);
      setCompanyMessage('Company updated successfully.');
      await fetchCompanies();
    } catch (err: any) {
      setCompanyMessage(err.response?.data?.message || 'Failed to update company.');
    } finally {
      setCompaniesLoading(false);
    }
  };

  const handleLogout = () => {
    authStorage.clear();
    setIsLoggedIn(false);
    setCurrentRole('user');
    setCurrentCompanyId(null);
    setCurrentModuleAccess([]);
    setShowLogin(false);
    setUsers([]);
    setCompanies([]);
    setTotalUsers(0);
    setTotalCompanies(0);
    setPage(0);
    setSearch('');
    setSearchInput('');
    setSelectedCompanyId(null);
    setSortBy('id');
    setSortOrder('asc');
    setCompanyPage(0);
    setCompanySearch('');
    setCompanySearchInput('');
    setCompanySortBy('id');
    setCompanySortOrder('asc');
    setAdminMessage(null);
    setCompanyMessage(null);
  };

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    setPage(0);
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setSelectedCompanyId(null);
    setPage(0);
  };

  const handleCompanyFilterChange = (companyId: number | null) => {
    setSelectedCompanyId(companyId);
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCompanySearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    setCompanyPage(0);
    setCompanySearch(companySearchInput.trim());
  };

  const handleClearCompanySearch = () => {
    setCompanySearchInput('');
    setCompanySearch('');
    setCompanyPage(0);
  };

  const handleCompanyChangePage = (_event: unknown, newPage: number) => {
    setCompanyPage(newPage);
  };

  const handleCompanyChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setCompanyRowsPerPage(parseInt(event.target.value, 10));
    setCompanyPage(0);
  };

  const handleSortByChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSortBy(event.target.value as SortBy);
    setPage(0);
  };

  const handleSortOrderChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSortOrder(event.target.value as SortOrder);
    setPage(0);
  };

  const handleCompanySortByChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCompanySortBy(event.target.value as CompanySortBy);
    setCompanyPage(0);
  };

  const handleCompanySortOrderChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCompanySortOrder(event.target.value as CompanySortOrder);
    setCompanyPage(0);
  };

  if (!isLoggedIn && !showLogin) {
    return <LandingPage onLoginClick={() => setShowLogin(true)} />;
  }

  if (!isLoggedIn && showLogin) {
    return (
      <LoginPage
        credentials={credentials}
        loading={loading}
        error={error}
        onChange={handleInputChange}
        onSubmit={handleLogin}
        onBack={() => setShowLogin(false)}
      />
    );
  }

  return (
    <RoleBasedWorkspace
      userEmail={authStorage.getUserEmail()}
      role={currentRole}
      moduleAccess={currentModuleAccess}
      users={users}
      usersLoading={usersLoading}
      adminMessage={adminMessage}
      newUser={newUser}
      totalUsers={totalUsers}
      page={page}
      rowsPerPage={rowsPerPage}
      searchInput={searchInput}
      selectedCompanyId={selectedCompanyId}
      sortBy={sortBy}
      sortOrder={sortOrder}
      currentUserCompanyId={currentCompanyId}
      companies={companies}
      companiesLoading={companiesLoading}
      companyMessage={companyMessage}
      newCompany={newCompany}
      totalCompanies={totalCompanies}
      companyPage={companyPage}
      companyRowsPerPage={companyRowsPerPage}
      companySearchInput={companySearchInput}
      companySortBy={companySortBy}
      companySortOrder={companySortOrder}
      onLogout={handleLogout}
      onRefresh={() => void fetchUsers()}
      onRefreshCompanies={() => void fetchCompanies()}
      onSearchInputChange={setSearchInput}
      onCompanyFilterChange={handleCompanyFilterChange}
      onSearchSubmit={handleSearchSubmit}
      onClearSearch={handleClearSearch}
      onCompanySearchInputChange={setCompanySearchInput}
      onCompanySearchSubmit={handleCompanySearchSubmit}
      onClearCompanySearch={handleClearCompanySearch}
      onNewUserChange={setNewUser}
      onCreateUser={handleCreateUser}
      onUpdateUser={(id, payload) => void handleUpdateUser(id, payload)}
      onResetUserPassword={(id, newPassword) => void handleResetUserPassword(id, newPassword)}
      onCreateCompanySystemAdminUser={(payload) => handleCompanySystemAdminCreateUser(payload)}
      onNewCompanyChange={setNewCompany}
      onCreateCompany={handleCreateCompany}
      onUpdateCompany={(id, payload) => void handleUpdateCompany(id, payload)}
      onToggleUser={(id, active) => void handleToggleUser(id, active)}
      onToggleCompany={(id, active) => void handleToggleCompany(id, active)}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      onSortByChange={handleSortByChange}
      onSortOrderChange={handleSortOrderChange}
      onCompanyPageChange={handleCompanyChangePage}
      onCompanyRowsPerPageChange={handleCompanyChangeRowsPerPage}
      onCompanySortByChange={handleCompanySortByChange}
      onCompanySortOrderChange={handleCompanySortOrderChange}
    />
  );
}
