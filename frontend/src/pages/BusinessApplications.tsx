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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { businessApplicationsApi, customAttributesApi, CustomAttributeDefinition } from '../services/api';
import { BusinessApplication, BusinessDomain, BusinessCriticality } from '../types';
import ColumnSelector, { ColumnDefinition, useColumnVisibility } from '../components/ColumnSelector';

const DOMAIN_COLORS: Record<BusinessDomain, 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  SALES: 'primary',
  MARKETING: 'secondary',
  FINANCE: 'success',
  HR: 'warning',
  OPERATIONS: 'info',
  IT: 'primary',
  CUSTOMER_SERVICE: 'secondary',
  SUPPLY_CHAIN: 'success',
  LEGAL: 'warning',
  R_AND_D: 'info',
  OTHER: 'default',
};

const CRITICALITY_COLORS: Record<BusinessCriticality, 'error' | 'warning' | 'info' | 'default'> = {
  CRITICAL: 'error',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'default',
};

// Default columns definition
const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { id: 'name', label: 'Name', defaultVisible: true },
  { id: 'description', label: 'Description', defaultVisible: false },
  { id: 'business_domain', label: 'Domain', defaultVisible: true },
  { id: 'business_criticality', label: 'Criticality', defaultVisible: true },
  { id: 'business_owner', label: 'Business Owner', defaultVisible: true },
  { id: 'business_capability', label: 'Capability', defaultVisible: false },
];

export default function BusinessApplications() {
  const navigate = useNavigate();
  const [businessApps, setBusinessApps] = useState<BusinessApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('');
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
    fetchBusinessApps();
  }, [page, rowsPerPage, search, domainFilter, criticalityFilter]);

  const loadCustomAttributes = async () => {
    try {
      const response = await customAttributesApi.getTemplate('BUSINESS_APPLICATION');
      setCustomAttributes(response.data.data.attributes || []);
    } catch (error) {
      console.error('Failed to load custom attributes:', error);
    }
  };

  const fetchBusinessApps = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (search) params.search = search;
      if (domainFilter) params.business_domain = domainFilter;
      if (criticalityFilter) params.business_criticality = criticalityFilter;

      const response = await businessApplicationsApi.getAll(params);
      const apps = response.data.data;
      setBusinessApps(apps);
      setTotal(response.data.total || 0);

      // Load custom values for visible custom columns
      const visibleCustomCols = Array.from(visibleColumns).filter(id => id.startsWith('custom_'));
      if (visibleCustomCols.length > 0 && apps.length > 0) {
        const valuesMap: Record<number, Record<string, any>> = {};
        await Promise.all(
          apps.map(async (app: BusinessApplication) => {
            try {
              const res = await customAttributesApi.getValues('BUSINESS_APPLICATION', app.id);
              valuesMap[app.id] = res.data.data || {};
            } catch {
              valuesMap[app.id] = {};
            }
          })
        );
        setCustomValues(valuesMap);
      }
    } catch (error) {
      console.error('Failed to fetch business applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this business application?')) return;
    try {
      await businessApplicationsApi.delete(String(id));
      fetchBusinessApps();
    } catch (error) {
      console.error('Failed to delete business application:', error);
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
            Business Applications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage business-level application portfolios
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/business-applications/new')}
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
        >
          Add Business Application
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search business applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: { xs: '100%', sm: 250 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 180 }, flex: { xs: '1 1 45%', sm: '0 0 auto' } }}>
            <InputLabel>Domain</InputLabel>
            <Select
              value={domainFilter}
              label="Domain"
              onChange={(e) => setDomainFilter(e.target.value)}
            >
              <MenuItem value="">All Domains</MenuItem>
              {Object.values(BusinessDomain).map((domain) => (
                <MenuItem key={domain} value={domain}>{domain.replace('_', ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 180 }, flex: { xs: '1 1 45%', sm: '0 0 auto' } }}>
            <InputLabel>Criticality</InputLabel>
            <Select
              value={criticalityFilter}
              label="Criticality"
              onChange={(e) => setCriticalityFilter(e.target.value)}
            >
              <MenuItem value="">All Criticalities</MenuItem>
              {Object.values(BusinessCriticality).map((criticality) => (
                <MenuItem key={criticality} value={criticality}>{criticality}</MenuItem>
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
        <TableContainer sx={{ minWidth: 800 }}>
          <Table>
            <TableHead>
              <TableRow>
                {isVisible('name') && <TableCell>Name</TableCell>}
                {isVisible('description') && <TableCell>Description</TableCell>}
                {isVisible('business_domain') && <TableCell>Domain</TableCell>}
                {isVisible('business_criticality') && <TableCell>Criticality</TableCell>}
                {isVisible('business_owner') && <TableCell>Business Owner</TableCell>}
                {isVisible('business_capability') && <TableCell>Capability</TableCell>}
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
              ) : businessApps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumnCount} align="center" sx={{ py: 4 }}>
                    No business applications found
                  </TableCell>
                </TableRow>
              ) : (
                businessApps.map((app) => (
                  <TableRow 
                    key={app.id} 
                    hover 
                    onClick={() => navigate(`/business-applications/${app.id}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {isVisible('name') && (
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusinessIcon color="primary" fontSize="small" />
                          <Typography fontWeight={500}>{app.name}</Typography>
                        </Box>
                      </TableCell>
                    )}
                    {isVisible('description') && (
                      <TableCell>
                        <Typography 
                          sx={{ 
                            maxWidth: 300, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' 
                          }}
                        >
                          {app.description || '-'}
                        </Typography>
                      </TableCell>
                    )}
                    {isVisible('business_domain') && (
                      <TableCell>
                        <Chip
                          label={app.business_domain.replace('_', ' ')}
                          color={DOMAIN_COLORS[app.business_domain]}
                          size="small"
                        />
                      </TableCell>
                    )}
                    {isVisible('business_criticality') && (
                      <TableCell>
                        <Chip
                          label={app.business_criticality}
                          color={CRITICALITY_COLORS[app.business_criticality]}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    )}
                    {isVisible('business_owner') && (
                      <TableCell>
                        {app.business_owner && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color="action" />
                            {app.business_owner}
                          </Box>
                        )}
                      </TableCell>
                    )}
                    {isVisible('business_capability') && (
                      <TableCell>{app.business_capability || '-'}</TableCell>
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
                        color="primary" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/business-applications/${app.id}?edit=true`);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(app.id);
                        }}
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
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>
    </Box>
  );
}
