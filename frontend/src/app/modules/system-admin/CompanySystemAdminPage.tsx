import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  Snackbar,
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
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { CompanySummary } from '../../shared/types/companies';
import { CreateUserPayload, UserSummary } from '../../shared/types/users';
import { OPERATION_SECTIONS } from '../../shared/constants/sections';
import { apiClient } from '../../shared/services/api';

type AvailState = 'idle' | 'checking' | 'available' | 'unavailable';

function availHelperText(state: AvailState): string {
  if (state === 'checking') return 'Checking...';
  if (state === 'available') return 'Available';
  if (state === 'unavailable') return 'Already in use';
  return ' ';
}

interface CompanySystemAdminPageProps {
  companies: CompanySummary[];
  currentUserCompanyId: number | null;
  currentUserCompanyName: string | null;
  currentUserRole: string;
  adminMessage: string | null;
  creating: boolean;
  onCreateUser: (payload: CreateUserPayload) => Promise<void>;
}

export function CompanySystemAdminPage(props: CompanySystemAdminPageProps) {
  const { companies, currentUserCompanyId, currentUserCompanyName, currentUserRole, adminMessage, creating, onCreateUser } = props;
  const [createOpen, setCreateOpen] = useState(false);
  const normalizedCurrentUserRole = currentUserRole.trim().toLowerCase();
  const canManageUsers = normalizedCurrentUserRole === 'admin' || normalizedCurrentUserRole === 'system_admin' || normalizedCurrentUserRole === 'company_admin';
  const canWriteCompanyData = normalizedCurrentUserRole === 'admin' || normalizedCurrentUserRole === 'system_admin' || normalizedCurrentUserRole === 'company_admin';

  const [companyId, setCompanyId] = useState<number | ''>(currentUserCompanyId ?? '');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [moduleAccess, setModuleAccess] = useState<string[]>([]);
  const [userCategory, setUserCategory] = useState<'qa' | 'general'>('general');
  const [userType, setUserType] = useState<'executive' | 'management'>('executive');
  const [createRole, setCreateRole] = useState<'company_admin' | 'manager' | 'user'>('user');
  const [userIdAvailability, setUserIdAvailability] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');

  const [updateCompanyOpen, setUpdateCompanyOpen] = useState(false);
  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [addLineOpen, setAddLineOpen] = useState(false);
  const [addBuyerOpen, setAddBuyerOpen] = useState(false);

  const [companyCode, setCompanyCode] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [unitCode, setUnitCode] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitAvailability, setUnitAvailability] = useState<AvailState>('idle');
  const [units, setUnits] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [lines, setLines] = useState<Array<{ id: number; unitId: number; unitCode: string; unitName: string; code: string; name: string }>>([]);
  const [buyers, setBuyers] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [masterDataLoading, setMasterDataLoading] = useState(false);

  const [lineUnitId, setLineUnitId] = useState<number | ''>('');
  const [lineCode, setLineCode] = useState('');
  const [lineName, setLineName] = useState('');
  const [lineAvailability, setLineAvailability] = useState<AvailState>('idle');

  const [buyerCode, setBuyerCode] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerAvailability, setBuyerAvailability] = useState<AvailState>('idle');

  const [editUnitOpen, setEditUnitOpen] = useState(false);
  const [editLineOpen, setEditLineOpen] = useState(false);
  const [editBuyerOpen, setEditBuyerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [editUnitId, setEditUnitId] = useState<number | null>(null);
  const [editUnitCode, setEditUnitCode] = useState('');
  const [editUnitName, setEditUnitName] = useState('');
  const [editUnitAvailability, setEditUnitAvailability] = useState<AvailState>('idle');

  const [editLineId, setEditLineId] = useState<number | null>(null);
  const [editLineUnitId, setEditLineUnitId] = useState<number | ''>('');
  const [editLineCode, setEditLineCode] = useState('');
  const [editLineName, setEditLineName] = useState('');
  const [editLineAvailability, setEditLineAvailability] = useState<AvailState>('idle');

  const [editBuyerId, setEditBuyerId] = useState<number | null>(null);
  const [editBuyerCode, setEditBuyerCode] = useState('');
  const [editBuyerName, setEditBuyerName] = useState('');
  const [editBuyerAvailability, setEditBuyerAvailability] = useState<AvailState>('idle');

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'unit' | 'line' | 'buyer'; id: number; label: string } | null>(null);

  const [busyAction, setBusyAction] = useState<
    'none' | 'company' | 'unit' | 'line' | 'buyer' | 'edit-unit' | 'edit-line' | 'edit-buyer' | 'delete'
  >('none');
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // User management state
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [usersPage, setUsersPage] = useState(0);
  const [usersRowsPerPage, setUsersRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editUserRole, setEditUserRole] = useState('user');
  const [editUserModuleAccess, setEditUserModuleAccess] = useState<string[]>([]);
  const [editUserCategory, setEditUserCategory] = useState<'qa' | 'general'>('general');
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === Number(companyId)) ?? null,
    [companies, companyId],
  );
  const tenantCompanyId = currentUserCompanyId ?? selectedCompany?.id ?? null;
  const canManageCompanyData = tenantCompanyId !== null;
  const isManagementUser = userType === 'management';

  useEffect(() => {
    if (currentUserCompanyId !== null) {
      setCompanyId(currentUserCompanyId);
      return;
    }

    if (companies.length === 1) {
      setCompanyId(companies[0].id);
      return;
    }

    if (companyId !== '' && companies.some((company) => company.id === Number(companyId))) {
      return;
    }

    setCompanyId('');
  }, [companies, companyId, currentUserCompanyId]);

  const resetForm = () => {
    setCompanyId(currentUserCompanyId ?? '');
    setUserId('');
    setPassword('');
    setFullName('');
    setModuleAccess([]);
    setUserCategory('general');
    setUserType('executive');
    setCreateRole('user');
    setUserIdAvailability('idle');
  };

  const openDialog = () => {
    if (!canManageUsers) {
      showToast('You have read-only access to company system administration.', 'error');
      return;
    }
    const nextCompanyId = tenantCompanyId ?? '';
    setCompanyId(nextCompanyId);
    setUserId('');
    setUserIdAvailability('idle');
    setCreateOpen(true);
  };

  const handleCompanyChange = (value: number | '') => {
    setCompanyId(value);
  };

  const handleCategoryChange = (category: 'qa' | 'general') => {
    setUserCategory(category);
    if (category === 'qa') {
      setModuleAccess((current) => (current.includes('Quality Assurance') ? current : [...current, 'Quality Assurance']));
      return;
    }

    setModuleAccess((current) => current.filter((item) => item !== 'Quality Assurance'));
  };

  useEffect(() => {
    if (!isManagementUser) {
      return;
    }
    setModuleAccess([...OPERATION_SECTIONS]);
    setUserCategory('general');
  }, [isManagementUser]);

  const loadUnits = useCallback(async () => {
    try {
      const response = await apiClient.get<{ items: Array<{ id: number; code: string; name: string }> }>('/units', {
        params: tenantCompanyId ? { companyId: tenantCompanyId } : undefined,
      });
      setUnits(response.data.items || []);
    } catch {
      setUnits([]);
    }
  }, [tenantCompanyId]);

  const loadLines = useCallback(async () => {
    try {
      const response = await apiClient.get<{
        items: Array<{ id: number; unitId: number; unitCode: string; unitName: string; code: string; name: string }>;
      }>('/lines', {
        params: tenantCompanyId ? { companyId: tenantCompanyId } : undefined,
      });
      setLines(response.data.items || []);
    } catch {
      setLines([]);
    }
  }, [tenantCompanyId]);

  const loadBuyers = useCallback(async () => {
    try {
      const response = await apiClient.get<{ items: Array<{ id: number; code: string; name: string }> }>('/buyers', {
        params: tenantCompanyId ? { companyId: tenantCompanyId } : undefined,
      });
      setBuyers(response.data.items || []);
    } catch {
      setBuyers([]);
    }
  }, [tenantCompanyId]);

  const refreshMasterData = useCallback(async () => {
    setMasterDataLoading(true);
    try {
      await Promise.all([loadUnits(), loadLines(), loadBuyers()]);
    } finally {
      setMasterDataLoading(false);
    }
  }, [loadBuyers, loadLines, loadUnits]);

  const openUpdateCompanyDialog = () => {
    if (!canWriteCompanyData) {
      showToast('You have read-only access to company data.', 'error');
      return;
    }
    if (!selectedCompany && currentUserCompanyId === null) {
      return;
    }
    setCompanyCode(selectedCompany?.code ?? '');
    setCompanyName(selectedCompany?.name ?? '');
    setUpdateCompanyOpen(true);
  };

  const openAddUnitDialog = () => {
    if (!canWriteCompanyData) {
      showToast('You have read-only access to company data.', 'error');
      return;
    }
    if (!canManageCompanyData) {
      showToast('Please select a company first', 'error');
      return;
    }
    setUnitCode('');
    setUnitName('');
    setUnitAvailability('idle');
    setAddUnitOpen(true);
  };

  const openAddLineDialog = async () => {
    if (!canWriteCompanyData) {
      showToast('You have read-only access to company data.', 'error');
      return;
    }
    if (!canManageCompanyData) {
      showToast('Please select a company first', 'error');
      return;
    }
    await refreshMasterData();
    setLineUnitId('');
    setLineCode('');
    setLineName('');
    setLineAvailability('idle');
    setAddLineOpen(true);
  };

  const openAddBuyerDialog = () => {
    if (!canWriteCompanyData) {
      showToast('You have read-only access to company data.', 'error');
      return;
    }
    if (!canManageCompanyData) {
      showToast('Please select a company first', 'error');
      return;
    }
    setBuyerCode('');
    setBuyerName('');
    setBuyerAvailability('idle');
    setAddBuyerOpen(true);
  };

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

  const openEditUnitDialog = (unit: { id: number; code: string; name: string }) => {
    setEditUnitId(unit.id);
    setEditUnitCode(unit.code);
    setEditUnitName(unit.name);
    setEditUnitAvailability('available');
    setEditUnitOpen(true);
  };

  const openEditLineDialog = async (line: { id: number; unitId: number; code: string; name: string }) => {
    await loadUnits();
    setEditLineId(line.id);
    setEditLineUnitId(line.unitId);
    setEditLineCode(line.code);
    setEditLineName(line.name);
    setEditLineAvailability('available');
    setEditLineOpen(true);
  };

  const openEditBuyerDialog = (buyer: { id: number; code: string; name: string }) => {
    setEditBuyerId(buyer.id);
    setEditBuyerCode(buyer.code);
    setEditBuyerName(buyer.name);
    setEditBuyerAvailability('available');
    setEditBuyerOpen(true);
  };

  const openDeleteDialog = (type: 'unit' | 'line' | 'buyer', id: number, label: string) => {
    setDeleteTarget({ type, id, label });
    setDeleteConfirmOpen(true);
  };

  const submitUpdateCompany = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCompany && currentUserCompanyId === null) return;
    setBusyAction('company');
    try {
      await apiClient.patch('/companies/my', {
        code: companyCode,
        name: companyName,
      });
      showToast('Company information updated', 'success');
      setUpdateCompanyOpen(false);
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to update company information', 'error');
    } finally {
      setBusyAction('none');
    }
  };

  const submitAddUnit = async (event: FormEvent) => {
    event.preventDefault();
    setBusyAction('unit');
    try {
      await apiClient.post(
        '/units',
        { code: unitCode, name: unitName },
        { params: tenantCompanyId ? { companyId: tenantCompanyId } : undefined },
      );
      await refreshMasterData();
      showToast('Unit added successfully', 'success');
      setAddUnitOpen(false);
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to add unit', 'error');
    } finally {
      setBusyAction('none');
    }
  };

  const submitAddLine = async (event: FormEvent) => {
    event.preventDefault();
    setBusyAction('line');
    try {
      await apiClient.post('/lines', {
        unitId: Number(lineUnitId),
        code: lineCode,
        name: lineName,
      }, {
        params: tenantCompanyId ? { companyId: tenantCompanyId } : undefined,
      });
      await refreshMasterData();
      showToast('Line added successfully', 'success');
      setAddLineOpen(false);
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to add line', 'error');
    } finally {
      setBusyAction('none');
    }
  };

  const submitAddBuyer = async (event: FormEvent) => {
    event.preventDefault();
    setBusyAction('buyer');
    try {
      await apiClient.post('/buyers', {
        code: buyerCode,
        name: buyerName,
      }, {
        params: tenantCompanyId ? { companyId: tenantCompanyId } : undefined,
      });
      await refreshMasterData();
      showToast('Buyer added successfully', 'success');
      setAddBuyerOpen(false);
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to add buyer', 'error');
    } finally {
      setBusyAction('none');
    }
  };

  const submitEditUnit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editUnitId) return;
    setBusyAction('edit-unit');
    try {
      await apiClient.patch(
        `/units/${editUnitId}`,
        { code: editUnitCode, name: editUnitName },
        { params: tenantCompanyId ? { companyId: tenantCompanyId } : undefined },
      );
      await refreshMasterData();
      showToast('Unit updated successfully', 'success');
      setEditUnitOpen(false);
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to update unit', 'error');
    } finally {
      setBusyAction('none');
    }
  };

  const submitEditLine = async (event: FormEvent) => {
    event.preventDefault();
    if (!editLineId || editLineUnitId === '') return;
    setBusyAction('edit-line');
    try {
      await apiClient.patch(
        `/lines/${editLineId}`,
        {
          unitId: Number(editLineUnitId),
          code: editLineCode,
          name: editLineName,
        },
        { params: tenantCompanyId ? { companyId: tenantCompanyId } : undefined },
      );
      await refreshMasterData();
      showToast('Line updated successfully', 'success');
      setEditLineOpen(false);
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to update line', 'error');
    } finally {
      setBusyAction('none');
    }
  };

  const submitEditBuyer = async (event: FormEvent) => {
    event.preventDefault();
    if (!editBuyerId) return;
    setBusyAction('edit-buyer');
    try {
      await apiClient.patch(
        `/buyers/${editBuyerId}`,
        { code: editBuyerCode, name: editBuyerName },
        { params: tenantCompanyId ? { companyId: tenantCompanyId } : undefined },
      );
      await refreshMasterData();
      showToast('Buyer updated successfully', 'success');
      setEditBuyerOpen(false);
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to update buyer', 'error');
    } finally {
      setBusyAction('none');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyAction('delete');
    try {
      if (deleteTarget.type === 'unit') {
        await apiClient.delete(`/units/${deleteTarget.id}`, {
          params: tenantCompanyId ? { companyId: tenantCompanyId } : undefined,
        });
      } else if (deleteTarget.type === 'line') {
        await apiClient.delete(`/lines/${deleteTarget.id}`, {
          params: tenantCompanyId ? { companyId: tenantCompanyId } : undefined,
        });
      } else {
        await apiClient.delete(`/buyers/${deleteTarget.id}`, {
          params: tenantCompanyId ? { companyId: tenantCompanyId } : undefined,
        });
      }
      await refreshMasterData();
      showToast(`${deleteTarget.type.toUpperCase()} deleted`, 'success');
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setBusyAction('none');
    }
  };

  const loadUsers = useCallback(async () => {
    if (!tenantCompanyId) {
      setUsers([]);
      setTotalUsers(0);
      return;
    }
    try {
      const response = await apiClient.get<{ items: UserSummary[]; total: number }>('/auth/users', {
        params: {
          page: usersPage + 1,
          limit: usersRowsPerPage,
          companyId: tenantCompanyId,
        },
      });
      setUsers(response.data.items || []);
      setTotalUsers(response.data.total || 0);
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to load users', 'error');
      setUsers([]);
      setTotalUsers(0);
    }
  }, [tenantCompanyId, usersPage, usersRowsPerPage]);

  const openEditUserDialog = (user: UserSummary) => {
    setEditUserId(user.id);
    setEditUserRole(user.role);
    setEditUserModuleAccess(user.moduleAccess || []);
    setEditUserCategory((user.userCategory as 'qa' | 'general') || 'general');
    setEditUserOpen(true);
  };

  const submitEditUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!editUserId) return;
    setBusyAction('edit-unit');
    try {
      await apiClient.patch(`/auth/users/${editUserId}`, {
        role: editUserRole,
        moduleAccess: editUserRole === 'admin' || editUserRole === 'system_admin' ? undefined : editUserModuleAccess,
        userCategory: editUserRole === 'admin' || editUserRole === 'system_admin' ? undefined : editUserCategory,
      });
      showToast('User updated successfully', 'success');
      setEditUserOpen(false);
      await loadUsers();
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to update user', 'error');
    } finally {
      setBusyAction('none');
    }
  };

  const openDeleteUserDialog = (userId: number) => {
    setDeleteTarget({ type: 'unit', id: userId, label: 'User' });
    setDeleteConfirmOpen(true);
  };

  const deleteUser = async () => {
    if (!deleteTarget || deleteTarget.type !== 'unit') return;
    setBusyAction('delete');
    try {
      await apiClient.delete(`/auth/users/${deleteTarget.id}`);
      showToast('User deleted successfully', 'success');
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      await loadUsers();
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setBusyAction('none');
    }
  };

  const toggleUserActivation = async (userId: number, isCurrentlyActive: boolean) => {
    setBusyAction('edit-unit');
    try {
      const route = isCurrentlyActive ? 'deactivate' : 'activate';
      await apiClient.patch(`/auth/users/${userId}/${route}`, {});
      showToast(`User ${isCurrentlyActive ? 'deactivated' : 'activated'} successfully`, 'success');
      await loadUsers();
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to update user status', 'error');
    } finally {
      setBusyAction('none');
    }
  };

  const openResetPasswordDialog = (userId: number) => {
    setResetPasswordUserId(userId);
    setNewPassword('');
    setShowResetPassword(false);
    setResetPasswordOpen(true);
  };

  const submitResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!resetPasswordUserId || !newPassword.trim()) return;
    setBusyAction('edit-unit');
    try {
      await apiClient.patch(`/auth/users/${resetPasswordUserId}/reset-password`, {
        newPassword,
      });
      showToast('Password reset successfully', 'success');
      setResetPasswordOpen(false);
      await loadUsers();
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setBusyAction('none');
    }
  };

  useEffect(() => {
    if (!canManageCompanyData) {
      setUnits([]);
      setLines([]);
      setBuyers([]);
      return;
    }
    void refreshMasterData();
  }, [canManageCompanyData, tenantCompanyId, refreshMasterData]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!createOpen) {
      return;
    }

    const normalizedUserId = userId.trim().toUpperCase();
    if (normalizedUserId.length < 3) {
      setUserIdAvailability('idle');
      return;
    }

    let active = true;
    setUserIdAvailability('checking');

    const timer = setTimeout(async () => {
      try {
        const response = await apiClient.get<{ available: boolean }>('/auth/user-id-availability', {
          params: { userId: normalizedUserId },
        });
        if (!active) {
          return;
        }
        setUserIdAvailability(response.data.available ? 'available' : 'unavailable');
      } catch {
        if (!active) {
          return;
        }
        setUserIdAvailability('idle');
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [createOpen, userId]);

  useEffect(() => {
    if (!addUnitOpen) {
      return;
    }
    if (tenantCompanyId === null) {
      setUnitAvailability('idle');
      return;
    }
    const code = unitCode.trim().toUpperCase();
    if (code.length < 2) {
      setUnitAvailability('idle');
      return;
    }
    let active = true;
    setUnitAvailability('checking');
    const timer = setTimeout(async () => {
      try {
        const response = await apiClient.get<{ available: boolean }>('/units/availability', {
          params: tenantCompanyId ? { code, companyId: tenantCompanyId } : { code },
        });
        if (!active) return;
        setUnitAvailability(response.data.available ? 'available' : 'unavailable');
      } catch {
        if (!active) return;
        setUnitAvailability('idle');
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [addUnitOpen, tenantCompanyId, unitCode]);

  useEffect(() => {
    if (!addLineOpen) {
      return;
    }
    if (tenantCompanyId === null) {
      setLineAvailability('idle');
      return;
    }
    const code = lineCode.trim().toUpperCase();
    if (code.length < 2) {
      setLineAvailability('idle');
      return;
    }
    let active = true;
    setLineAvailability('checking');
    const timer = setTimeout(async () => {
      try {
        const response = await apiClient.get<{ available: boolean }>('/lines/availability', {
          params: tenantCompanyId ? { code, companyId: tenantCompanyId } : { code },
        });
        if (!active) return;
        setLineAvailability(response.data.available ? 'available' : 'unavailable');
      } catch {
        if (!active) return;
        setLineAvailability('idle');
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [addLineOpen, lineCode, tenantCompanyId]);

  useEffect(() => {
    if (!addBuyerOpen) {
      return;
    }
    if (tenantCompanyId === null) {
      setBuyerAvailability('idle');
      return;
    }
    const code = buyerCode.trim().toUpperCase();
    if (code.length < 2) {
      setBuyerAvailability('idle');
      return;
    }
    let active = true;
    setBuyerAvailability('checking');
    const timer = setTimeout(async () => {
      try {
        const response = await apiClient.get<{ available: boolean }>('/buyers/availability', {
          params: tenantCompanyId ? { code, companyId: tenantCompanyId } : { code },
        });
        if (!active) return;
        setBuyerAvailability(response.data.available ? 'available' : 'unavailable');
      } catch {
        if (!active) return;
        setBuyerAvailability('idle');
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [addBuyerOpen, buyerCode, tenantCompanyId]);

  useEffect(() => {
    if (!editUnitOpen || editUnitId === null) {
      return;
    }
    const code = editUnitCode.trim().toUpperCase();
    if (code.length < 2) {
      setEditUnitAvailability('idle');
      return;
    }
    let active = true;
    setEditUnitAvailability('checking');
    const timer = setTimeout(async () => {
      try {
        const response = await apiClient.get<{ available: boolean }>('/units/availability', {
          params: tenantCompanyId
            ? { code, excludeId: editUnitId, companyId: tenantCompanyId }
            : { code, excludeId: editUnitId },
        });
        if (!active) return;
        setEditUnitAvailability(response.data.available ? 'available' : 'unavailable');
      } catch {
        if (!active) return;
        setEditUnitAvailability('idle');
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [editUnitOpen, editUnitCode, editUnitId, tenantCompanyId]);

  useEffect(() => {
    if (!editLineOpen || editLineId === null) {
      return;
    }
    const code = editLineCode.trim().toUpperCase();
    if (code.length < 2) {
      setEditLineAvailability('idle');
      return;
    }
    let active = true;
    setEditLineAvailability('checking');
    const timer = setTimeout(async () => {
      try {
        const response = await apiClient.get<{ available: boolean }>('/lines/availability', {
          params: tenantCompanyId
            ? { code, excludeId: editLineId, companyId: tenantCompanyId }
            : { code, excludeId: editLineId },
        });
        if (!active) return;
        setEditLineAvailability(response.data.available ? 'available' : 'unavailable');
      } catch {
        if (!active) return;
        setEditLineAvailability('idle');
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [editLineOpen, editLineCode, editLineId, tenantCompanyId]);

  useEffect(() => {
    if (!editBuyerOpen || editBuyerId === null) {
      return;
    }
    const code = editBuyerCode.trim().toUpperCase();
    if (code.length < 2) {
      setEditBuyerAvailability('idle');
      return;
    }
    let active = true;
    setEditBuyerAvailability('checking');
    const timer = setTimeout(async () => {
      try {
        const response = await apiClient.get<{ available: boolean }>('/buyers/availability', {
          params: tenantCompanyId
            ? { code, excludeId: editBuyerId, companyId: tenantCompanyId }
            : { code, excludeId: editBuyerId },
        });
        if (!active) return;
        setEditBuyerAvailability(response.data.available ? 'available' : 'unavailable');
      } catch {
        if (!active) return;
        setEditBuyerAvailability('idle');
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [editBuyerOpen, editBuyerCode, editBuyerId, tenantCompanyId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const role = currentUserCompanyId !== null ? createRole : (userType === 'management' ? 'manager' : 'user');
    const isMgmtOrCompanyAdmin = role === 'manager' || role === 'company_admin';
    try {
      await onCreateUser({
        userId,
        password,
        role,
        companyId: companyId === '' ? undefined : Number(companyId),
        fullName,
        moduleAccess: isMgmtOrCompanyAdmin ? [...OPERATION_SECTIONS] : moduleAccess,
        userCategory: isMgmtOrCompanyAdmin ? undefined : userCategory,
        userType: userType,
      });
      setCreateOpen(false);
      resetForm();
      void loadUsers();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to create user.', 'error');
    }
  };

  return (
    <Box
      sx={{
        minHeight: 320,
        p: 3,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Company System Admin
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {currentUserCompanyId === null && (
          <TextField
            select
            size="small"
            label="Company Name"
            value={companyId}
            onChange={(e) => handleCompanyChange(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ minWidth: 280 }}
          >
            <MenuItem value="">Select Company Name</MenuItem>
            {companies.map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.code} - {company.name}
              </MenuItem>
            ))}
          </TextField>
        )}
        <Button variant="contained" onClick={openDialog} disabled={!canManageUsers}>
          Create User
        </Button>
        <Button variant="outlined" onClick={openUpdateCompanyDialog} disabled={!canWriteCompanyData || (!selectedCompany && currentUserCompanyId === null)}>
          Update Company Information
        </Button>
        <Button variant="outlined" onClick={openAddUnitDialog} disabled={!canWriteCompanyData || !canManageCompanyData}>
          Add Unit
        </Button>
        <Button variant="outlined" onClick={openAddLineDialog} disabled={!canWriteCompanyData || !canManageCompanyData}>
          Add Line
        </Button>
        <Button variant="outlined" onClick={openAddBuyerDialog} disabled={!canWriteCompanyData || !canManageCompanyData}>
          Add Buyer
        </Button>
      </Stack>

      {adminMessage && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {adminMessage}
        </Alert>
      )}

      <Stack spacing={2} sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Company Master Data</Typography>
          <Button variant="text" onClick={() => void refreshMasterData()} disabled={masterDataLoading || !canManageCompanyData}>
            {masterDataLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
          <Box sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            <Typography variant="subtitle2" sx={{ px: 2, py: 1.25, bgcolor: 'background.default' }}>
              Units
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {units.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>No units found</TableCell>
                    </TableRow>
                  ) : (
                    units.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell>{unit.code}</TableCell>
                        <TableCell>{unit.name}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" onClick={() => openEditUnitDialog(unit)} disabled={!canWriteCompanyData}>Edit</Button>
                            <Button size="small" color="error" onClick={() => openDeleteDialog('unit', unit.id, unit.code)} disabled={!canWriteCompanyData}>
                              Delete
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            <Typography variant="subtitle2" sx={{ px: 2, py: 1.25, bgcolor: 'background.default' }}>
              Lines
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>No lines found</TableCell>
                    </TableRow>
                  ) : (
                    lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.code}</TableCell>
                        <TableCell>{line.name}</TableCell>
                        <TableCell>{line.unitCode ? `${line.unitCode} - ${line.unitName}` : line.unitName}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" onClick={() => openEditLineDialog(line)} disabled={!canWriteCompanyData}>Edit</Button>
                            <Button size="small" color="error" onClick={() => openDeleteDialog('line', line.id, line.code)} disabled={!canWriteCompanyData}>
                              Delete
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            <Typography variant="subtitle2" sx={{ px: 2, py: 1.25, bgcolor: 'background.default' }}>
              Buyers
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {buyers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>No buyers found</TableCell>
                    </TableRow>
                  ) : (
                    buyers.map((buyer) => (
                      <TableRow key={buyer.id}>
                        <TableCell>{buyer.code}</TableCell>
                        <TableCell>{buyer.name}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" onClick={() => openEditBuyerDialog(buyer)} disabled={!canWriteCompanyData}>Edit</Button>
                            <Button size="small" color="error" onClick={() => openDeleteDialog('buyer', buyer.id, buyer.code)} disabled={!canWriteCompanyData}>
                              Delete
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </Stack>

      <Stack spacing={2} sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Company Users</Typography>
        </Stack>

        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>No users found</TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.userId}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.isActive ? 'Yes' : 'No'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" onClick={() => openEditUserDialog(user)} disabled={!canManageUsers}>Edit</Button>
                          <Button size="small" onClick={() => openResetPasswordDialog(user.id)} disabled={!canManageUsers}>Reset Pwd</Button>
                          <Button 
                            size="small" 
                            onClick={() => toggleUserActivation(user.id, user.isActive)}
                            color={user.isActive ? 'warning' : 'success'}
                            disabled={!canManageUsers}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button size="small" color="error" onClick={() => openDeleteUserDialog(user.id)} disabled={!canManageUsers}>
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalUsers}
            rowsPerPage={usersRowsPerPage}
            page={usersPage}
            onPageChange={(e, newPage) => setUsersPage(newPage)}
            onRowsPerPageChange={(e) => setUsersRowsPerPage(parseInt(e.target.value, 10))}
          />
        </Box>
      </Stack>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <DialogTitle>Create User</DialogTitle>
          <IconButton onClick={() => setCreateOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {currentUserCompanyId === null && (
                <TextField
                  select
                  label="Company Name"
                  value={companyId}
                  onChange={(e) => handleCompanyChange(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  fullWidth
                >
                  <MenuItem value="">Select Company Name</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.code} - {company.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              {currentUserCompanyId !== null && (
                <TextField
                  label="Company Name"
                  value={selectedCompany?.name || currentUserCompanyName || ''}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              )}
              <TextField
                label="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value.toUpperCase())}
                required
                fullWidth
                error={userIdAvailability === 'unavailable'}
                helperText={
                  userIdAvailability === 'checking'
                    ? 'Checking availability...'
                    : userIdAvailability === 'available'
                      ? 'Available'
                      : userIdAvailability === 'unavailable'
                        ? 'Not available'
                        : ' '
                }
                InputProps={{
                  endAdornment: userIdAvailability === 'checking' ? <CircularProgress size={18} /> : undefined,
                }}
              />
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField label="Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required fullWidth />
              <TextField
                select
                label="Access Sections"
                value={isManagementUser ? OPERATION_SECTIONS : moduleAccess}
                onChange={(e) => {
                  const value = e.target.value;
                  setModuleAccess(typeof value === 'string' ? value.split(',') : value);
                }}
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {(selected as string[]).map((section) => (
                        <Chip key={section} label={section} size="small" />
                      ))}
                    </Box>
                  ),
                }}
                fullWidth
                disabled={isManagementUser}
              >
                {OPERATION_SECTIONS.map((section) => {
                  const selected = moduleAccess.includes(section);
                  return (
                    <MenuItem
                      key={section}
                      value={section}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        bgcolor: selected ? 'success.light' : undefined,
                        '&:hover': {
                          bgcolor: selected ? 'success.light' : undefined,
                        },
                      }}
                    >
                      <ListItemText primary={section} />
                      {selected && (
                        <ListItemIcon sx={{ minWidth: 28, justifyContent: 'center', color: 'success.main' }}>
                          <CheckCircleRoundedIcon fontSize="small" />
                        </ListItemIcon>
                      )}
                    </MenuItem>
                  );
                })}
              </TextField>
              {!isManagementUser && (
                <TextField
                  select
                  label="User Category"
                  value={userCategory}
                  onChange={(e) => handleCategoryChange(e.target.value as 'qa' | 'general')}
                  fullWidth
                >
                  <MenuItem value="qa">QA</MenuItem>
                  <MenuItem value="general">General</MenuItem>
                </TextField>
              )}
              {currentUserCompanyId !== null ? (
                <TextField
                  select
                  label="Role"
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as 'company_admin' | 'manager' | 'user')}
                  fullWidth
                >
                  {(normalizedCurrentUserRole === 'admin' || normalizedCurrentUserRole === 'system_admin') && <MenuItem value="company_admin">Company Admin</MenuItem>}
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                </TextField>
              ) : (
                <TextField
                  select
                  label="User Type"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as 'executive' | 'management')}
                  fullWidth
                >
                  <MenuItem value="executive">Executive</MenuItem>
                  <MenuItem value="management">Management</MenuItem>
                </TextField>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                creating ||
                !userId ||
                !password ||
                !fullName ||
                companyId === '' ||
                userIdAvailability === 'checking' ||
                userIdAvailability === 'unavailable'
              }
            >
              Create User
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={updateCompanyOpen} onClose={() => setUpdateCompanyOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <DialogTitle>Update Company Information</DialogTitle>
          <IconButton onClick={() => setUpdateCompanyOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box component="form" onSubmit={submitUpdateCompany}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Company Code"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                required
                fullWidth
              />
              <TextField
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUpdateCompanyOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={busyAction === 'company'}>
              {busyAction === 'company' ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={addUnitOpen} onClose={() => setAddUnitOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <DialogTitle>Add Unit</DialogTitle>
          <IconButton onClick={() => setAddUnitOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box component="form" onSubmit={submitAddUnit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Unit Code"
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value.toUpperCase())}
                required
                fullWidth
                error={unitAvailability === 'unavailable'}
                helperText={availHelperText(unitAvailability)}
                InputProps={{
                  endAdornment: unitAvailability === 'checking' ? <CircularProgress size={18} /> : undefined,
                }}
              />
              <TextField
                label="Unit Name"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                required
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddUnitOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                busyAction === 'unit' ||
                !unitCode.trim() ||
                !unitName.trim() ||
                unitAvailability === 'checking' ||
                unitAvailability === 'unavailable'
              }
            >
              {busyAction === 'unit' ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={addLineOpen} onClose={() => setAddLineOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <DialogTitle>Add Line</DialogTitle>
          <IconButton onClick={() => setAddLineOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box component="form" onSubmit={submitAddLine}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                select
                label="Unit"
                value={lineUnitId}
                onChange={(e) => setLineUnitId(e.target.value === '' ? '' : Number(e.target.value))}
                required
                fullWidth
              >
                <MenuItem value="">Select Unit</MenuItem>
                {units.map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.code} - {unit.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Line Code"
                value={lineCode}
                onChange={(e) => setLineCode(e.target.value.toUpperCase())}
                required
                fullWidth
                error={lineAvailability === 'unavailable'}
                helperText={availHelperText(lineAvailability)}
                InputProps={{
                  endAdornment: lineAvailability === 'checking' ? <CircularProgress size={18} /> : undefined,
                }}
              />
              <TextField
                label="Line Name"
                value={lineName}
                onChange={(e) => setLineName(e.target.value)}
                required
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddLineOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={busyAction === 'line' || lineUnitId === '' || lineAvailability !== 'available'}
            >
              {busyAction === 'line' ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={addBuyerOpen} onClose={() => setAddBuyerOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <DialogTitle>Add Buyer</DialogTitle>
          <IconButton onClick={() => setAddBuyerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box component="form" onSubmit={submitAddBuyer}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Buyer Code"
                value={buyerCode}
                onChange={(e) => setBuyerCode(e.target.value.toUpperCase())}
                required
                fullWidth
                error={buyerAvailability === 'unavailable'}
                helperText={availHelperText(buyerAvailability)}
                InputProps={{
                  endAdornment: buyerAvailability === 'checking' ? <CircularProgress size={18} /> : undefined,
                }}
              />
              <TextField
                label="Buyer Name"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                required
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddBuyerOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={busyAction === 'buyer' || buyerAvailability !== 'available'}
            >
              {busyAction === 'buyer' ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={editUnitOpen} onClose={() => setEditUnitOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <DialogTitle>Edit Unit</DialogTitle>
          <IconButton onClick={() => setEditUnitOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box component="form" onSubmit={submitEditUnit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Unit Code"
                value={editUnitCode}
                onChange={(e) => setEditUnitCode(e.target.value.toUpperCase())}
                required
                fullWidth
                error={editUnitAvailability === 'unavailable'}
                helperText={availHelperText(editUnitAvailability)}
                InputProps={{
                  endAdornment: editUnitAvailability === 'checking' ? <CircularProgress size={18} /> : undefined,
                }}
              />
              <TextField label="Unit Name" value={editUnitName} onChange={(e) => setEditUnitName(e.target.value)} required fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditUnitOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={busyAction === 'edit-unit' || editUnitAvailability !== 'available'}>
              {busyAction === 'edit-unit' ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={editLineOpen} onClose={() => setEditLineOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <DialogTitle>Edit Line</DialogTitle>
          <IconButton onClick={() => setEditLineOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box component="form" onSubmit={submitEditLine}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                select
                label="Unit"
                value={editLineUnitId}
                onChange={(e) => setEditLineUnitId(e.target.value === '' ? '' : Number(e.target.value))}
                required
                fullWidth
              >
                <MenuItem value="">Select Unit</MenuItem>
                {units.map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.code} - {unit.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Line Code"
                value={editLineCode}
                onChange={(e) => setEditLineCode(e.target.value.toUpperCase())}
                required
                fullWidth
                error={editLineAvailability === 'unavailable'}
                helperText={availHelperText(editLineAvailability)}
                InputProps={{
                  endAdornment: editLineAvailability === 'checking' ? <CircularProgress size={18} /> : undefined,
                }}
              />
              <TextField label="Line Name" value={editLineName} onChange={(e) => setEditLineName(e.target.value)} required fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditLineOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={busyAction === 'edit-line' || editLineUnitId === '' || editLineAvailability !== 'available'}
            >
              {busyAction === 'edit-line' ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={editBuyerOpen} onClose={() => setEditBuyerOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <DialogTitle>Edit Buyer</DialogTitle>
          <IconButton onClick={() => setEditBuyerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box component="form" onSubmit={submitEditBuyer}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Buyer Code"
                value={editBuyerCode}
                onChange={(e) => setEditBuyerCode(e.target.value.toUpperCase())}
                required
                fullWidth
                error={editBuyerAvailability === 'unavailable'}
                helperText={availHelperText(editBuyerAvailability)}
                InputProps={{
                  endAdornment: editBuyerAvailability === 'checking' ? <CircularProgress size={18} /> : undefined,
                }}
              />
              <TextField label="Buyer Name" value={editBuyerName} onChange={(e) => setEditBuyerName(e.target.value)} required fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditBuyerOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={busyAction === 'edit-buyer' || editBuyerAvailability !== 'available'}>
              {busyAction === 'edit-buyer' ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={deleteConfirmOpen && deleteTarget?.label !== 'User'} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <IconButton onClick={() => setDeleteConfirmOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent>
          <Typography>
            Delete {deleteTarget?.type} <strong>{deleteTarget?.label}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={busyAction === 'delete'}>
            {busyAction === 'delete' ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <DialogTitle>Edit User</DialogTitle>
          <IconButton onClick={() => setEditUserOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box component="form" onSubmit={submitEditUser}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                select
                label="Role"
                value={editUserRole}
                onChange={(e) => setEditUserRole(e.target.value)}
                fullWidth
              >
                <MenuItem value="company_admin">Company Admin</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="user">User</MenuItem>
              </TextField>
              <TextField
                label="Access Sections"
                value={editUserRole === 'manager' || editUserRole === 'company_admin' ? OPERATION_SECTIONS : editUserModuleAccess}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditUserModuleAccess(typeof value === 'string' ? value.split(',') : value);
                }}
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {(selected as string[]).map((section) => (
                        <Chip key={section} label={section} size="small" />
                      ))}
                    </Box>
                  ),
                }}
                fullWidth
                disabled={editUserRole === 'manager' || editUserRole === 'company_admin'}
                select
                multiline
                maxRows={4}
              >
                {OPERATION_SECTIONS.map((section) => {
                  const selected = editUserModuleAccess.includes(section);
                  return (
                    <MenuItem
                      key={section}
                      value={section}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        bgcolor: selected ? 'success.light' : undefined,
                        '&:hover': {
                          bgcolor: selected ? 'success.light' : undefined,
                        },
                      }}
                    >
                      <ListItemText primary={section} />
                      {selected && (
                        <ListItemIcon sx={{ minWidth: 28, justifyContent: 'center', color: 'success.main' }}>
                          <CheckCircleRoundedIcon fontSize="small" />
                        </ListItemIcon>
                      )}
                    </MenuItem>
                  );
                })}
              </TextField>
              {editUserRole !== 'manager' && editUserRole !== 'company_admin' && (
                <TextField
                  select
                  label="User Category"
                  value={editUserCategory}
                  onChange={(e) => setEditUserCategory(e.target.value as 'qa' | 'general')}
                  fullWidth
                >
                  <MenuItem value="qa">QA</MenuItem>
                  <MenuItem value="general">General</MenuItem>
                </TextField>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditUserOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={busyAction === 'edit-unit'}>
              {busyAction === 'edit-unit' ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={resetPasswordOpen} onClose={() => setResetPasswordOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <DialogTitle>Reset Password</DialogTitle>
          <IconButton onClick={() => setResetPasswordOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box component="form" onSubmit={submitResetPassword}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="New Password"
                type={showResetPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowResetPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showResetPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetPasswordOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={busyAction === 'edit-unit' || !newPassword.trim()}>
              {busyAction === 'edit-unit' ? 'Resetting...' : 'Reset'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={deleteConfirmOpen && deleteTarget?.label === 'User'} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this user? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={deleteUser} variant="contained" color="error" disabled={busyAction === 'delete'}>
            {busyAction === 'delete' ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} onClose={() => setToast((current) => ({ ...current, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}