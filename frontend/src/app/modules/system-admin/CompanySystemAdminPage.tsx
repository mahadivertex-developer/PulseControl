import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { CompanySummary } from '../../shared/types/companies';
import { CreateUserPayload } from '../../shared/types/users';
import { OPERATION_SECTIONS } from '../../shared/constants/sections';

interface CompanySystemAdminPageProps {
  companies: CompanySummary[];
  currentUserCompanyId: number | null;
  adminMessage: string | null;
  creating: boolean;
  onCreateUser: (payload: CreateUserPayload) => Promise<void>;
}

function generateCompanyUserId(companyCode?: string) {
  const prefix = (companyCode || 'USR').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6) || 'USR';
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${suffix}`;
}

export function CompanySystemAdminPage(props: CompanySystemAdminPageProps) {
  const { companies, currentUserCompanyId, adminMessage, creating, onCreateUser } = props;
  const [createOpen, setCreateOpen] = useState(false);

  const [companyId, setCompanyId] = useState<number | ''>(currentUserCompanyId ?? '');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [moduleAccess, setModuleAccess] = useState<string[]>([]);
  const [userCategory, setUserCategory] = useState<'qa' | 'general'>('general');
  const [generalCategory, setGeneralCategory] = useState('');
  const [userType, setUserType] = useState<'executive' | 'management'>('executive');

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === Number(companyId)) ?? null,
    [companies, companyId],
  );

  const resetForm = () => {
    setCompanyId(currentUserCompanyId ?? '');
    setUserId('');
    setPassword('');
    setFullName('');
    setPhoneNumber('');
    setModuleAccess([]);
    setUserCategory('general');
    setGeneralCategory('');
    setUserType('executive');
  };

  const openDialog = () => {
    const nextCompanyId = currentUserCompanyId ?? '';
    setCompanyId(nextCompanyId);
    const code = companies.find((company) => company.id === Number(nextCompanyId))?.code;
    setUserId(generateCompanyUserId(code));
    setCreateOpen(true);
  };

  const handleCompanyChange = (value: number | '') => {
    setCompanyId(value);
    const code = companies.find((company) => company.id === Number(value))?.code;
    setUserId(generateCompanyUserId(code));
  };

  const handleCategoryChange = (category: 'qa' | 'general') => {
    setUserCategory(category);
    if (category === 'qa') {
      setModuleAccess((current) => (current.includes('Quality Assurance') ? current : [...current, 'Quality Assurance']));
      setGeneralCategory('');
      return;
    }

    setModuleAccess((current) => current.filter((item) => item !== 'Quality Assurance'));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onCreateUser({
      userId,
      password,
      role: userType === 'management' ? 'manager' : 'user',
      companyId: companyId === '' ? undefined : Number(companyId),
      fullName,
      phoneNumber,
      moduleAccess,
      userCategory,
      generalCategory: userCategory === 'general' ? generalCategory : '',
      userType,
    });
    setCreateOpen(false);
    resetForm();
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
        <Button variant="contained" onClick={openDialog}>
          Create User
        </Button>
      </Stack>

      {adminMessage && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {adminMessage}
        </Alert>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create User</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {currentUserCompanyId === null && (
                <TextField
                  select
                  label="Company"
                  value={companyId}
                  onChange={(e) => handleCompanyChange(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  fullWidth
                >
                  <MenuItem value="">Select Company</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.code} - {company.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              {currentUserCompanyId !== null && (
                <TextField label="Company" value={selectedCompany?.name || ''} disabled fullWidth />
              )}
              <TextField label="User ID" value={userId} onChange={(e) => setUserId(e.target.value.toUpperCase())} required fullWidth />
              <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
              <TextField label="Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required fullWidth />
              <TextField label="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} fullWidth />
              <TextField
                select
                label="Access Sections"
                value={moduleAccess}
                onChange={(e) => {
                  const value = e.target.value;
                  setModuleAccess(typeof value === 'string' ? value.split(',') : value);
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
              <TextField
                select
                label="User Role"
                value={userCategory}
                onChange={(e) => handleCategoryChange(e.target.value as 'qa' | 'general')}
                fullWidth
              >
                <MenuItem value="qa">QA</MenuItem>
                <MenuItem value="general">General</MenuItem>
              </TextField>
              <TextField
                label="General Category"
                value={generalCategory}
                onChange={(e) => setGeneralCategory(e.target.value)}
                disabled={userCategory !== 'general'}
                fullWidth
              />
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
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={creating || !userId || !password || !fullName || companyId === ''}>
              Create User
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}