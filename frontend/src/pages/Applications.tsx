import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { applicationsApi, customAttributesApi, CustomAttributeDefinition } from '../services/api';
import { Application, ApplicationType, LifecycleStatus, BusinessCriticality } from '../types';
import ColumnSelector, { ColumnDefinition, useColumnVisibility } from '../components/ColumnSelector';

const CRITICALITY_COLORS: Record<BusinessCriticality, 'error' | 'warning' | 'primary' | 'success'> = {
  CRITICAL: 'error',
  HIGH: 'warning',
  MEDIUM: 'primary',
  LOW: 'success',
};

const STATUS_COLORS: Record<LifecycleStatus, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  PLANNING: 'default',
  DEVELOPMENT: 'info',
  ACTIVE: 'success',
  MAINTENANCE: 'warning',
  DEPRECATED: 'error',
  RETIRED: 'default',
};

// Default columns definition
const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { id: 'name', label: 'Name', defaultVisible: true },
  { id: 'type', label: 'Type', defaultVisible: true },
  { id: 'lifecycle_status', label: 'Status', defaultVisible: true },
  { id: 'business_criticality', label: 'Criticality', defaultVisible: true },
  { id: 'department', label: 'Department', defaultVisible: true },
  { id: 'description', label: 'Description', defaultVisible: false },
  { id: 'documentation_url', label: 'Documentation URL', defaultVisible: false },
  { id: 'repository_url', label: 'Repository URL', defaultVisible: false },
];

export default function Applications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [criticalityFilter, setCriticalityFilter] = useState<string>('');
  const [customAttributes, setCustomAttributes] = useState<CustomAttributeDefinition[]>([]);
  const [customValues, setCustomValues] = useState<Record<number, Record<string, any>>>({});

  // Build all columns (default + custom)
  const allColumns = useMemo(() => {
    const customCols: ColumnDefinition[] = customAttributes
      .filter(attr => attr.is_active)
      .map(attr => ({
        id: `custom_${attr.id}`,
        label: attr.label,
        defaultVisible: false,
        isCustom: true,
      }));
    return [...DEFAULT_COLUMNS, ...customCols];
  }, [customAttributes]);

  const { visibleColumns, toggleColumn, isVisible } = useColumnVisibility(allColumns);

  useEffect(() => {
    loadCustomAttributes();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [page, rowsPerPage, search, typeFilter, statusFilter, criticalityFilter]);

  const loadCustomAttributes = async () => {
    try {
      const response = await customAttributesApi.getTemplate('APPLICATION');
      setCustomAttributes(response.data.data.attributes || []);
    } catch (error) {
      console.error('Failed to load custom attributes:', error);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.lifecycle_status = statusFilter;
      if (criticalityFilter) params.business_criticality = criticalityFilter;

      const response = await applicationsApi.getAll(params);
      const apps = response.data.data;
      setApplications(apps);
      setTotal(response.data.total);

      // Load custom values for visible custom columns
      const visibleCustomCols = Array.from(visibleColumns).filter(id => id.startsWith('custom_'));
      if (visibleCustomCols.length > 0 && apps.length > 0) {
        const valuesMap: Record<number, Record<string, any>> = {};
        await Promise.all(
          apps.map(async (app: Application) => {
            try {
              const res = await customAttributesApi.getValues('APPLICATION', app.id);
              valuesMap[app.id] = res.data.data || {};
            } catch {
              valuesMap[app.id] = {};
            }
          })
        );
        setCustomValues(valuesMap);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await applicationsApi.delete(String(id));
        fetchApplications();
      } catch (error) {
        console.error('Failed to delete application:', error);
      }
    }
  };

  const getCustomValue = (appId: number, attrId: number) => {
    const attr = customAttributes.find(a => a.id === attrId);
    if (!attr) return '-';
    const values = customValues[appId] || {};
    const value = values[attr.name];
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  // Count visible columns for colspan
  const visibleColumnCount = Array.from(visibleColumns).length + 1; // +1 for actions

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        gap: 2,
        mb: 3 
      }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            Applications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your application inventory
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/applications/new')}
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
        >
          Add Application
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: { xs: '100%', sm: 250 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 150 }, flex: { xs: '1 1 45%', sm: '0 0 auto' } }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              {Object.values(ApplicationType).map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 150 }, flex: { xs: '1 1 45%', sm: '0 0 auto' } }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              {Object.values(LifecycleStatus).map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 150 }, flex: { xs: '1 1 45%', sm: '0 0 auto' } }}>
            <InputLabel>Criticality</InputLabel>
            <Select
              value={criticalityFilter}
              label="Criticality"
              onChange={(e) => setCriticalityFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {Object.values(BusinessCriticality).map((crit) => (
                <MenuItem key={crit} value={crit}>{crit}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* Table */}
      <Card sx={{ overflowX: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <ColumnSelector
            columns={allColumns}
            visibleColumns={visibleColumns}
            onColumnToggle={toggleColumn}
          />
        </Box>
        <TableContainer sx={{ minWidth: 650 }}>
          <Table>
            <TableHead>
              <TableRow>
                {isVisible('name') && <TableCell>Name</TableCell>}
                {isVisible('type') && <TableCell>Type</TableCell>}
                {isVisible('lifecycle_status') && <TableCell>Status</TableCell>}
                {isVisible('business_criticality') && <TableCell>Criticality</TableCell>}
                {isVisible('department') && <TableCell>Department</TableCell>}
                {isVisible('description') && <TableCell>Description</TableCell>}
                {isVisible('documentation_url') && <TableCell>Docs URL</TableCell>}
                {isVisible('repository_url') && <TableCell>Repo URL</TableCell>}
                {/* Custom attribute headers */}
                {customAttributes.filter(attr => attr.is_active && isVisible(`custom_${attr.id}`)).map(attr => (
                  <TableCell key={attr.id}>{attr.label}</TableCell>
                ))}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={visibleColumnCount} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumnCount} align="center" sx={{ py: 4 }}>
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id} hover>
                    {isVisible('name') && (
                      <TableCell>
                        <Typography fontWeight={500}>{app.name}</Typography>
                      </TableCell>
                    )}
                    {isVisible('type') && (
                      <TableCell>
                        <Chip label={app.type} size="small" variant="outlined" />
                      </TableCell>
                    )}
                    {isVisible('lifecycle_status') && (
                      <TableCell>
                        <Chip 
                          label={app.lifecycle_status} 
                          size="small" 
                          color={STATUS_COLORS[app.lifecycle_status]}
                        />
                      </TableCell>
                    )}
                    {isVisible('business_criticality') && (
                      <TableCell>
                        <Chip 
                          label={app.business_criticality} 
                          size="small" 
                          color={CRITICALITY_COLORS[app.business_criticality]}
                        />
                      </TableCell>
                    )}
                    {isVisible('department') && (
                      <TableCell>{app.department || '-'}</TableCell>
                    )}
                    {isVisible('description') && (
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {app.description || '-'}
                        </Typography>
                      </TableCell>
                    )}
                    {isVisible('documentation_url') && (
                      <TableCell>
                        {app.documentation_url ? (
                          <a href={app.documentation_url} target="_blank" rel="noopener noreferrer">Link</a>
                        ) : '-'}
                      </TableCell>
                    )}
                    {isVisible('repository_url') && (
                      <TableCell>
                        {app.repository_url ? (
                          <a href={app.repository_url} target="_blank" rel="noopener noreferrer">Link</a>
                        ) : '-'}
                      </TableCell>
                    )}
                    {/* Custom attribute values */}
                    {customAttributes.filter(attr => attr.is_active && isVisible(`custom_${attr.id}`)).map(attr => (
                      <TableCell key={attr.id}>
                        {getCustomValue(app.id, attr.id)}
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/applications/${app.id}`)}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={() => navigate(`/applications/${app.id}?edit=true`)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDelete(app.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
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
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </Box>
  );
}
