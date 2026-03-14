import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { OPERATION_SECTIONS } from '../../shared/constants/sections';
import { CompanySummary } from '../../shared/types/companies';
import { CreateUserPayload, SortBy, SortOrder, UpdateUserPayload, UserSummary } from '../../shared/types/users';

interface UserManagementPageProps {
  companies: CompanySummary[];
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
  currentUserEmail: string | null;
  currentUserCompanyId: number | null;
  currentUserRole: string;
  onRefresh: () => void;
  onSearchInputChange: (value: string) => void;
  onCompanyFilterChange: (companyId: number | null) => void;
  onSearchSubmit: (event: FormEvent) => void;
  onClearSearch: () => void;
  onNewUserChange: (value: CreateUserPayload) => void;
  onCreateUser: (event: FormEvent) => void;
  onUpdateUser: (id: number, payload: UpdateUserPayload) => void;
  onToggleUser: (id: number, active: boolean) => void;
  onResetUserPassword: (id: number, newPassword: string) => void;
  onPageChange: (_event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSortByChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSortOrderChange: (event: ChangeEvent<HTMLInputElement>) => void;
  pageTitle?: string;
  openCreateOnLoad?: boolean;
  forcedCreateRole?: 'company_admin' | 'user' | 'manager';
}

export function UserManagementPage(props: UserManagementPageProps) {
  const {
    companies,
    users,
    usersLoading,
    adminMessage,
    newUser,
    totalUsers,
    page,
    rowsPerPage,
    searchInput,
    selectedCompanyId,
    sortBy,
    sortOrder,
    currentUserEmail,
    currentUserCompanyId,
    currentUserRole,
    onRefresh,
    onSearchInputChange,
    onCompanyFilterChange,
    onSearchSubmit,
    onClearSearch,
    onNewUserChange,
    onCreateUser,
    onUpdateUser,
    onToggleUser,
    onResetUserPassword,
    onPageChange,
    onRowsPerPageChange,
    onSortByChange,
    onSortOrderChange,
    pageTitle = 'Users',
    openCreateOnLoad = false,
    forcedCreateRole,
  } = props;

  const isSystemAdmin = currentUserRole === 'admin' || currentUserRole === 'system_admin';
  const isCompanyAdmin = currentUserRole === 'company_admin';

  const userRoleOptions = useMemo(
    () =>
      isCompanyAdmin
        ? [
            { value: 'user', label: 'Employee' },
            { value: 'manager', label: 'Management' },
          ]
        : [
            { value: 'user', label: 'Employee' },
            { value: 'manager', label: 'Management' },
            { value: 'company_admin', label: 'Company Admin' },
          ],
    [isCompanyAdmin],
  );

  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createUserCategory, setCreateUserCategory] = useState<'general' | 'qa'>('general');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editCompanyId, setEditCompanyId] = useState<string>('');
  const [editModuleAccess, setEditModuleAccess] = useState<string[]>([]);
  const [editUserCategory, setEditUserCategory] = useState<'general' | 'qa'>('general');

  useEffect(() => {
    if (openCreateOnLoad) {
      setCreateUserOpen(true);
    }
  }, [openCreateOnLoad]);

  useEffect(() => {
    if (forcedCreateRole && newUser.role !== forcedCreateRole) {
      onNewUserChange({ ...newUser, role: forcedCreateRole });
    }
  }, [forcedCreateRole, newUser, onNewUserChange]);

  const applyCategoryToModules = (modules: string[] | undefined, category: 'general' | 'qa') => {
    const currentModules = [...(modules ?? [])];
    if (category === 'qa') {
      if (!currentModules.includes('Quality Assurance')) {
        currentModules.push('Quality Assurance');
      }
      return currentModules;
    }
    return currentModules.filter((module) => module !== 'Quality Assurance');
  };

  const openCreateDialog = () => {
    setCreateUserOpen(true);
    if (forcedCreateRole && newUser.role !== forcedCreateRole) {
      onNewUserChange({ ...newUser, role: forcedCreateRole });
    }
  };

  const onCreateCategoryChange = (category: 'general' | 'qa') => {
    setCreateUserCategory(category);
    onNewUserChange({
      ...newUser,
      moduleAccess: applyCategoryToModules(newUser.moduleAccess ?? [], category),
    });
  };

  const openEditDialog = (user: UserSummary) => {
    setEditingUser(user);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditCompanyId(user.companyId ? String(user.companyId) : '');
    setEditModuleAccess(user.moduleAccess ?? []);
    setEditUserCategory((user.moduleAccess ?? []).includes('Quality Assurance') ? 'qa' : 'general');
  };

  const closeEditDialog = () => {
    setEditingUser(null);
  };

  const saveEditUser = () => {
    if (!editingUser || !editEmail.trim()) {
      return;
    }

    onUpdateUser(editingUser.id, {
      email: editEmail.trim(),
      role: editRole,
      companyId: isSystemAdmin ? (editCompanyId ? Number(editCompanyId) : undefined) : undefined,
      moduleAccess: applyCategoryToModules(editModuleAccess, editUserCategory),
    });

    closeEditDialog();
  };

  const isSystemRole = (role: string) => role === 'admin' || role === 'system_admin';

  const canResetPassword = (user: UserSummary) => {
    if (isSystemAdmin) {
      return true;
    }

    if (!isCompanyAdmin) {
      return false;
    }

    const inSameCompany = user.companyId !== null && user.companyId === currentUserCompanyId;
    const targetIsSystemRole = isSystemRole(user.role);
    const targetIsCompanyAdmin = user.role === 'company_admin';

    return inSameCompany && !targetIsSystemRole && !targetIsCompanyAdmin;
  };

  const handleResetPassword = (user: UserSummary) => {
    const newPassword = window.prompt(`Set a new password for ${user.email} (minimum 6 characters):`);
    if (newPassword === null) {
      return;
    }

    const trimmedPassword = newPassword.trim();
    if (trimmedPassword.length < 6) {
      window.alert('Password must be at least 6 characters.');
      return;
    }

    onResetUserPassword(user.id, trimmedPassword);
  };

  const handleCreateUserSubmit = (event: FormEvent) => {
    onCreateUser(event);
    setCreateUserOpen(false);
  };

  const getUserTypeLabel = (role: string) => {
    if (role === 'manager') {
      return 'Management';
    }
    if (role === 'company_admin') {
      return 'Company Admin';
    }
    return 'Employee';
  };

  const getUserCategoryLabel = (moduleAccess?: string[]) =>
    (moduleAccess ?? []).includes('Quality Assurance') ? 'QA' : 'General';

  const getUserIdentifier = (user: UserSummary) => user.userId || user.email;

  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6">{pageTitle}</Typography>
            <Button
              variant="contained"
              onClick={openCreateDialog}
              disabled={usersLoading}
              sx={{ minWidth: 36, width: 36, height: 36, borderRadius: '50%', p: 0 }}
            >
              +
            </Button>
          </Stack>
          <Box component="form" onSubmit={onSearchSubmit} sx={{ width: '100%' }}>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1}>
              <TextField
                label="Search"
                placeholder="Email, role, company"
                value={searchInput}
                onChange={(e) => onSearchInputChange(e.target.value)}
                size="small"
                sx={{ minWidth: 220 }}
              />
              {isSystemAdmin && (
                <TextField
                  select
                  label="Company"
                  value={selectedCompanyId ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    onCompanyFilterChange(value === '' ? null : Number(value));
                  }}
                  size="small"
                  sx={{ minWidth: 170 }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="0">Platform</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.code} - {company.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <TextField select label="Sort" value={sortBy} onChange={onSortByChange} size="small" sx={{ minWidth: 140 }}>
                <MenuItem value="id">ID</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="role">Role</MenuItem>
                <MenuItem value="company">Company</MenuItem>
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="createdAt">Created</MenuItem>
              </TextField>
              <TextField select label="Order" value={sortOrder} onChange={onSortOrderChange} size="small" sx={{ minWidth: 130 }}>
                <MenuItem value="asc">Asc</MenuItem>
                <MenuItem value="desc">Desc</MenuItem>
              </TextField>
              <Button type="submit" variant="contained" disabled={usersLoading}>Search</Button>
              <Button type="button" variant="text" onClick={onClearSearch} disabled={usersLoading}>Clear</Button>
              <Button variant="outlined" onClick={onRefresh} disabled={usersLoading}>Refresh</Button>
            </Stack>
          </Box>
        </Stack>

        {adminMessage && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {adminMessage}
          </Alert>
        )}

        {usersLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>User ID / Login</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>User Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Section Access</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{getUserIdentifier(user)}</TableCell>
                    <TableCell>{user.fullName || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={getUserTypeLabel(user.role)}
                        color={user.role === 'manager' ? 'primary' : user.role === 'company_admin' ? 'secondary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getUserCategoryLabel(user.moduleAccess)}
                        color={getUserCategoryLabel(user.moduleAccess) === 'QA' ? 'info' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{user.companyName || 'Platform'}</TableCell>
                    <TableCell>{(user.moduleAccess ?? []).join(', ') || 'None'}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="text"
                        disabled={usersLoading}
                        onClick={() => openEditDialog(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="info"
                        disabled={usersLoading || !canResetPassword(user)}
                        onClick={() => handleResetPassword(user)}
                      >
                        Reset Password
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color={user.isActive ? 'warning' : 'success'}
                        disabled={usersLoading || (user.email === currentUserEmail && user.isActive)}
                        onClick={() => onToggleUser(user.id, user.isActive)}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={totalUsers}
              page={page}
              onPageChange={onPageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={onRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 20, 50]}
            />
          </TableContainer>
        )}
      </Card>

      <Dialog open={Boolean(editingUser)} onClose={closeEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} fullWidth />
            <TextField select label="Role" value={editRole} onChange={(e) => setEditRole(e.target.value)} fullWidth>
              {userRoleOptions.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="User Category"
              value={editUserCategory}
              onChange={(e) => setEditUserCategory(e.target.value as 'general' | 'qa')}
              fullWidth
            >
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="qa">QA</MenuItem>
            </TextField>
            {isSystemAdmin && (
              <TextField
                select
                label="Company"
                value={editCompanyId}
                onChange={(e) => setEditCompanyId(e.target.value)}
                fullWidth
              >
                <MenuItem value="">No Company (admin/system_admin only)</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={String(company.id)}>
                    {company.code} - {company.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              select
              label="Section Access"
              value={editModuleAccess}
              onChange={(e) => {
                const value = e.target.value;
                setEditModuleAccess(typeof value === 'string' ? value.split(',') : value);
              }}
              SelectProps={{ multiple: true }}
              fullWidth
            >
              {OPERATION_SECTIONS.map((section) => (
                <MenuItem key={section} value={section}>
                  {section}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveEditUser} disabled={!editEmail.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createUserOpen} onClose={() => setCreateUserOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{forcedCreateRole === 'company_admin' ? 'Create Company Admin' : 'Create User'}</DialogTitle>
        <Box component="form" onSubmit={handleCreateUserSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => onNewUserChange({ ...newUser, email: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={newUser.password}
                onChange={(e) => onNewUserChange({ ...newUser, password: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Role"
                value={newUser.role}
                onChange={(e) => onNewUserChange({ ...newUser, role: e.target.value || 'user' })}
                select
                disabled={Boolean(forcedCreateRole)}
                fullWidth
              >
                {userRoleOptions
                  .filter((role) => !forcedCreateRole || role.value === forcedCreateRole)
                  .map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
              </TextField>
              <TextField
                select
                label="User Category"
                value={createUserCategory}
                onChange={(e) => onCreateCategoryChange(e.target.value as 'general' | 'qa')}
                fullWidth
              >
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="qa">QA</MenuItem>
              </TextField>
              {isSystemAdmin && (
                <TextField
                  select
                  label="Company"
                  value={newUser.companyId ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    onNewUserChange({
                      ...newUser,
                      companyId: value === '' ? undefined : Number(value),
                    });
                  }}
                  fullWidth
                >
                  <MenuItem value="">No Company (admin/system_admin only)</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.code} - {company.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <TextField
                select
                label="Section Access"
                value={newUser.moduleAccess ?? []}
                onChange={(e) => {
                  const value = e.target.value;
                  onNewUserChange({
                    ...newUser,
                    moduleAccess: typeof value === 'string' ? value.split(',') : value,
                  });
                }}
                SelectProps={{ multiple: true }}
                fullWidth
              >
                {OPERATION_SECTIONS.map((section) => (
                  <MenuItem key={section} value={section}>
                    {section}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateUserOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={usersLoading || !newUser.email || !newUser.password}>
              {forcedCreateRole === 'company_admin' ? 'Create Company Admin' : 'Create User'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
