import type { ChangeEvent, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  Divider,
  Drawer,
  List,
  ListItemIcon,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventNoteIcon from '@mui/icons-material/EventNote';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import HandymanIcon from '@mui/icons-material/Handyman';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentsIcon from '@mui/icons-material/Payments';
import SellIcon from '@mui/icons-material/Sell';
import GroupIcon from '@mui/icons-material/Group';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VerifiedIcon from '@mui/icons-material/Verified';
import SecurityIcon from '@mui/icons-material/Security';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto';
import { CompanyManagementPage } from '../modules/system-admin/CompanyManagementPage';
import { CompanySystemAdminPage } from '../modules/system-admin/CompanySystemAdminPage';
import { UserManagementPage } from '../modules/system-admin/UserManagementPage';
import { MerchandisingPage } from '../modules/merchandising/MerchandisingPage';
import { OPERATION_SECTIONS } from '../shared/constants/sections';
import { CompanySortBy, CompanySortOrder, CompanySummary, CreateCompanyPayload, UpdateCompanyPayload } from '../shared/types/companies';
import { CreateUserPayload, SortBy, SortOrder, UpdateUserPayload, UserSummary } from '../shared/types/users';
import { useTheme } from '../shared/context/ThemeContext';

const DRAWER_OPEN_WIDTH = 270;
const DRAWER_CLOSED_WIDTH = 64;

interface RoleBasedWorkspaceProps {
  userEmail: string | null;
  role: string;
  currentUserCompanyId: number | null;
  currentUserCompanyName: string | null;
  moduleAccess: string[];
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
  onCreateCompanySystemAdminUser: (payload: CreateUserPayload) => Promise<void>;
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

function SectionPlaceholder({ title }: { title: string }) {
  return (
    <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      <Typography color="text.secondary">
        {title} dashboard will show company-specific ERP data for this section.
      </Typography>
    </Box>
  );
}

export function RoleBasedWorkspace(props: RoleBasedWorkspaceProps) {
  const isSystemAdmin = props.role === 'admin' || props.role === 'system_admin';
  const isCompanyAdmin = props.role === 'company_admin';
  const isManagement = props.role === 'manager';
  const { mode, setMode } = useTheme();
  const [themeAnchor, setThemeAnchor] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const drawerWidth = drawerOpen ? DRAWER_OPEN_WIDTH : DRAWER_CLOSED_WIDTH;

  const defaultCompanySections = OPERATION_SECTIONS.map((section) => section.toString());
  const accessibleSections = useMemo(() => {
    if (isSystemAdmin) {
      return defaultCompanySections;
    }
    if (isCompanyAdmin || isManagement) {
      return defaultCompanySections;
    }
    if (!props.moduleAccess || props.moduleAccess.length === 0) {
      return [];
    }
    return props.moduleAccess;
  }, [defaultCompanySections, isCompanyAdmin, isManagement, isSystemAdmin, props.moduleAccess]);

  const baseItems = isSystemAdmin
    ? ['System Admin', 'Company System Admin', ...defaultCompanySections]
    : isCompanyAdmin
    ? ['Company System Admin', ...accessibleSections]
    : ['Company Dashboard', ...accessibleSections];

  const navItems = isCompanyAdmin ? [...baseItems, 'User Access'] : baseItems;

  const [selectedNav, setSelectedNav] = useState<string>(navItems[0]);
  const [adminTab, setAdminTab] = useState<'companies' | 'users'>('companies');

  const showCompanyNameInHeader = !isSystemAdmin && Boolean(props.currentUserCompanyName);
  const appHeaderTitle = showCompanyNameInHeader
    ? `Bonon ERP | ${props.currentUserCompanyName}`
    : 'Bonon ERP';

  const getNavIcon = (item: string) => {
    switch (item) {
      case 'System Admin':
        return <AdminPanelSettingsIcon fontSize="small" />;
      case 'Company Admin':
        return <ManageAccountsIcon fontSize="small" />;
      case 'Company Dashboard':
        return <DashboardIcon fontSize="small" />;
      case 'User Access':
        return <GroupIcon fontSize="small" />;
      case 'Company System Admin':
        return <ManageAccountsIcon fontSize="small" />;
      case 'Dashboard':
        return <DashboardIcon fontSize="small" />;
      case 'Merchandising':
        return <SellIcon fontSize="small" />;
      case 'Planning':
        return <EventNoteIcon fontSize="small" />;
      case 'Store':
        return <StorefrontIcon fontSize="small" />;
      case 'Cutting':
        return <ContentCutIcon fontSize="small" />;
      case 'Sewing':
        return <HandymanIcon fontSize="small" />;
      case 'Washing':
        return <LocalLaundryServiceIcon fontSize="small" />;
      case 'Finishing':
        return <TaskAltIcon fontSize="small" />;
      case 'Packing':
        return <Inventory2Icon fontSize="small" />;
      case 'Shipment':
        return <LocalShippingIcon fontSize="small" />;
      case 'Commercial':
        return <PaymentsIcon fontSize="small" />;
      case 'GRN':
        return <ReceiptIcon fontSize="small" />;
      case 'Quality Assurance':
        return <VerifiedIcon fontSize="small" />;
      case 'Admin':
        return <SecurityIcon fontSize="small" />;
      default:
        return <DashboardIcon fontSize="small" />;
    }
  };

  const renderContent = () => {
    if (selectedNav === 'System Admin' && isSystemAdmin) {
      return (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant={adminTab === 'companies' ? 'contained' : 'outlined'}
              onClick={() => setAdminTab('companies')}
              sx={{ textTransform: 'none', fontSize: '1rem' }}
            >
              Company Management
            </Button>
            <Button
              variant={adminTab === 'users' ? 'contained' : 'outlined'}
              onClick={() => setAdminTab('users')}
              sx={{ textTransform: 'none', fontSize: '1rem' }}
            >
              Admin User Management
            </Button>
          </Box>

          {adminTab === 'companies' && (
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
          )}

          {adminTab === 'users' && (
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
              currentUserRole={props.role}
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
        </Box>
      );
    }

    if (selectedNav === 'User Access' && isCompanyAdmin) {
      return (
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
          currentUserRole={props.role}
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
          pageTitle="Company Employees"
        />
      );
    }

    if (selectedNav === 'Company System Admin') {
      return (
        <CompanySystemAdminPage
          companies={props.companies}
          currentUserCompanyId={props.currentUserCompanyId}
          currentUserCompanyName={props.currentUserCompanyName}
          currentUserRole={props.role}
          adminMessage={props.adminMessage}
          creating={props.usersLoading}
          onCreateUser={props.onCreateCompanySystemAdminUser}
        />
      );
    }

    if (selectedNav === 'Merchandising') {
      return <MerchandisingPage />;
    }

    return <SectionPlaceholder title={selectedNav} />;
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          width: '100%',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={() => setDrawerOpen((prev) => !prev)}
            edge="start"
            sx={{ mr: 1 }}
          >
            {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {appHeaderTitle}
          </Typography>
          <IconButton
            color="inherit"
            onClick={(e) => setThemeAnchor(e.currentTarget)}
            title="Theme"
            sx={{ mr: 1 }}
          >
            {mode === 'dark' ? <Brightness4Icon /> : mode === 'light' ? <Brightness7Icon /> : <BrightnessAutoIcon />}
          </IconButton>
          <Menu
            anchorEl={themeAnchor}
            open={Boolean(themeAnchor)}
            onClose={() => setThemeAnchor(null)}
          >
            <MenuItem selected={mode === 'light'} onClick={() => { setMode('light'); setThemeAnchor(null); }}>
              <Brightness7Icon sx={{ mr: 1 }} /> Light
            </MenuItem>
            <MenuItem selected={mode === 'dark'} onClick={() => { setMode('dark'); setThemeAnchor(null); }}>
              <Brightness4Icon sx={{ mr: 1 }} /> Dark
            </MenuItem>
            <MenuItem selected={mode === 'system'} onClick={() => { setMode('system'); setThemeAnchor(null); }}>
              <BrightnessAutoIcon sx={{ mr: 1 }} /> System
            </MenuItem>
          </Menu>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {props.userEmail}
          </Typography>
          <Button color="inherit" onClick={props.onLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: 'width 0.2s ease',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Toolbar />
        <Divider />
        <List>
          {navItems.map((item) => (
            <Tooltip key={item} title={drawerOpen ? '' : item} placement="right">
              <ListItemButton
                selected={selectedNav === item}
                onClick={() => setSelectedNav(item)}
                sx={{
                  px: 2,
                  '&.Mui-selected': { bgcolor: 'action.selected' },
                  '&.Mui-selected:hover': { bgcolor: 'action.selected' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{getNavIcon(item)}</ListItemIcon>
                {drawerOpen && <ListItemText primary={item} />}
              </ListItemButton>
            </Tooltip>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Toolbar />
        {renderContent()}
      </Box>
    </Box>
  );
}
