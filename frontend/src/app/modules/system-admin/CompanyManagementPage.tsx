import { useState } from 'react';
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
  IconButton,
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
import CloseIcon from '@mui/icons-material/Close';
import {
  CompanySortBy,
  CompanySortOrder,
  CompanySummary,
  CreateCompanyPayload,
  UpdateCompanyPayload,
} from '../../shared/types/companies';

interface CompanyManagementPageProps {
  companies: CompanySummary[];
  companiesLoading: boolean;
  companyMessage: string | null;
  newCompany: CreateCompanyPayload;
  totalCompanies: number;
  page: number;
  rowsPerPage: number;
  searchInput: string;
  sortBy: CompanySortBy;
  sortOrder: CompanySortOrder;
  onRefresh: () => void;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent) => void;
  onClearSearch: () => void;
  onNewCompanyChange: (value: CreateCompanyPayload) => void;
  onCreateCompany: (event: FormEvent) => void;
  onUpdateCompany: (id: number, payload: UpdateCompanyPayload) => void;
  onToggleCompany: (id: number, active: boolean) => void;
  onPageChange: (_event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSortByChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSortOrderChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function CompanyManagementPage(props: CompanyManagementPageProps) {
  const {
    companies,
    companiesLoading,
    companyMessage,
    newCompany,
    totalCompanies,
    page,
    rowsPerPage,
    searchInput,
    sortBy,
    sortOrder,
    onRefresh,
    onSearchInputChange,
    onSearchSubmit,
    onClearSearch,
    onNewCompanyChange,
    onCreateCompany,
    onUpdateCompany,
    onToggleCompany,
    onPageChange,
    onRowsPerPageChange,
    onSortByChange,
    onSortOrderChange,
  } = props;

  const [editingCompany, setEditingCompany] = useState<CompanySummary | null>(null);
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editValidityDate, setEditValidityDate] = useState('');

  const openEditDialog = (company: CompanySummary) => {
    setEditingCompany(company);
    setEditCode(company.code);
    setEditName(company.name);
    setEditValidityDate(company.validityDate || '');
  };

  const closeEditDialog = () => {
    setEditingCompany(null);
  };

  const saveCompanyEdit = () => {
    if (!editingCompany || !editCode.trim() || !editName.trim()) {
      return;
    }

    onUpdateCompany(editingCompany.id, {
      code: editCode.trim(),
      name: editName.trim(),
      validityDate: editValidityDate || undefined,
    });
    closeEditDialog();
  };

  const handleCreateCompanySubmit = (event: FormEvent) => {
    onCreateCompany(event);
    setCreateCompanyOpen(false);
  };

  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6">Companies</Typography>
            <Button
              variant="contained"
              onClick={() => setCreateCompanyOpen(true)}
              disabled={companiesLoading}
              sx={{ minWidth: 36, width: 36, height: 36, borderRadius: '50%', p: 0 }}
            >
              +
            </Button>
          </Stack>
          <Box component="form" onSubmit={onSearchSubmit}>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1} flexWrap="wrap">
              <TextField
                label="Search"
                placeholder="Code or name"
                value={searchInput}
                onChange={(e) => onSearchInputChange(e.target.value)}
                size="small"
                sx={{ minWidth: 220 }}
              />
              <TextField select label="Sort" value={sortBy} onChange={onSortByChange} size="small" sx={{ minWidth: 140 }}>
                <MenuItem value="id">ID</MenuItem>
                <MenuItem value="code">Code</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="createdAt">Created</MenuItem>
              </TextField>
              <TextField select label="Order" value={sortOrder} onChange={onSortOrderChange} size="small" sx={{ minWidth: 130 }}>
                <MenuItem value="asc">Asc</MenuItem>
                <MenuItem value="desc">Desc</MenuItem>
              </TextField>
              <Button type="submit" variant="contained" disabled={companiesLoading}>Search</Button>
              <Button type="button" variant="text" onClick={onClearSearch} disabled={companiesLoading}>Clear</Button>
              <Button variant="outlined" onClick={onRefresh} disabled={companiesLoading}>Refresh</Button>
            </Stack>
          </Box>
        </Stack>


        {companyMessage && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {companyMessage}
          </Alert>
        )}

        {companiesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Validity Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>{company.id}</TableCell>
                    <TableCell>{company.code}</TableCell>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{new Date(company.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{company.validityDate ? new Date(company.validityDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={company.isActive ? 'Active' : 'Inactive'}
                        color={company.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="text"
                        disabled={companiesLoading}
                        onClick={() => openEditDialog(company)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color={company.isActive ? 'warning' : 'success'}
                        disabled={companiesLoading}
                        onClick={() => onToggleCompany(company.id, company.isActive)}
                      >
                        {company.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={totalCompanies}
              page={page}
              onPageChange={onPageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={onRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 20, 50]}
            />
          </TableContainer>
        )}
      </Card>

      <Dialog open={Boolean(editingCompany)} onClose={closeEditDialog} maxWidth="sm" fullWidth>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <DialogTitle>Edit Company</DialogTitle>
          <IconButton onClick={closeEditDialog} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Company Code" value={editCode} onChange={(e) => setEditCode(e.target.value)} fullWidth />
            <TextField label="Company Name" value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth />
            <TextField
              label="Validity Date"
              type="date"
              value={editValidityDate}
              onChange={(e) => setEditValidityDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveCompanyEdit} disabled={!editCode.trim() || !editName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createCompanyOpen} onClose={() => setCreateCompanyOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          <DialogTitle>Create Company</DialogTitle>
          <IconButton onClick={() => setCreateCompanyOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box component="form" onSubmit={handleCreateCompanySubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Company Code"
                value={newCompany.code}
                onChange={(e) => onNewCompanyChange({ ...newCompany, code: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Company Name"
                value={newCompany.name}
                onChange={(e) => onNewCompanyChange({ ...newCompany, name: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Validity Date"
                type="date"
                value={newCompany.validityDate}
                onChange={(e) => onNewCompanyChange({ ...newCompany, validityDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateCompanyOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={companiesLoading || !newCompany.code || !newCompany.name || !newCompany.validityDate}>
              Create Company
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
