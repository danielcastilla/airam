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
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { technologiesApi, customAttributesApi, CustomAttributeDefinition } from '../services/api';
import { Technology, TechnologyStatus } from '../types';
import ColumnSelector, { ColumnDefinition, useColumnVisibility } from '../components/ColumnSelector';

const STATUS_COLORS: Record<TechnologyStatus, 'success' | 'warning' | 'error' | 'info'> = {
  ACTIVE: 'success',
  DEPRECATED: 'warning',
  OBSOLETE: 'error',
  EMERGING: 'info',
};

// Default columns definition
const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { id: 'name', label: 'Name', defaultVisible: true },
  { id: 'version', label: 'Version', defaultVisible: true },
  { id: 'category', label: 'Category', defaultVisible: true },
  { id: 'status', label: 'Status', defaultVisible: true },
  { id: 'end_of_life_date', label: 'End of Life', defaultVisible: true },
  { id: 'description', label: 'Description', defaultVisible: false },
  { id: 'documentation_url', label: 'Documentation URL', defaultVisible: false },
];

export default function Technologies() {
  const navigate = useNavigate();
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
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
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTechnologies();
  }, [page, rowsPerPage, search, statusFilter, categoryFilter]);

  const loadCustomAttributes = async () => {
    try {
      const response = await customAttributesApi.getTemplate('TECHNOLOGY');
      setCustomAttributes(response.data.data.attributes || []);
    } catch (error) {
      console.error('Failed to load custom attributes:', error);
    }
  };

  const fetchTechnologies = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;

      const response = await technologiesApi.getAll(params);
      const techs = response.data.data;
      setTechnologies(techs);
      setTotal(response.data.total);

      // Load custom values for visible custom columns
      const visibleCustomCols = Array.from(visibleColumns).filter(id => id.startsWith('custom_'));
      if (visibleCustomCols.length > 0 && techs.length > 0) {
        const valuesMap: Record<number, Record<string, any>> = {};
        await Promise.all(
          techs.map(async (tech: Technology) => {
            try {
              const res = await customAttributesApi.getValues('TECHNOLOGY', tech.id);
              valuesMap[tech.id] = res.data.data || {};
            } catch {
              valuesMap[tech.id] = {};
            }
          })
        );
        setCustomValues(valuesMap);
      }
    } catch (error) {
      console.error('Failed to fetch technologies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await technologiesApi.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this technology?')) {
      try {
        await technologiesApi.delete(String(id));
        fetchTechnologies();
      } catch (error) {
        console.error('Failed to delete technology:', error);
      }
    }
  };

  const isEndOfLife = (date?: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const getCustomValue = (techId: number, attrId: number) => {
    const attr = customAttributes.find(a => a.id === attrId);
    if (!attr) return '-';
    const values = customValues[techId] || {};
    const value = values[attr.name];
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  // Count visible columns for colspan
  const visibleColumnCount = Array.from(visibleColumns).length + 1; // +1 for actions

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            Technologies
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage technology stack and versions
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }} onClick={() => navigate('/technologies/new')}>
          Add Technology
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search technologies..."
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
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              {Object.values(TechnologyStatus).map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* Table */}
      <Card>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <ColumnSelector
            columns={allColumns}
            visibleColumns={visibleColumns}
            onColumnToggle={toggleColumn}
          />
        </Box>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                {isVisible('name') && <TableCell>Name</TableCell>}
                {isVisible('version') && <TableCell>Version</TableCell>}
                {isVisible('category') && <TableCell>Category</TableCell>}
                {isVisible('status') && <TableCell>Status</TableCell>}
                {isVisible('end_of_life_date') && <TableCell>End of Life</TableCell>}
                {isVisible('description') && <TableCell>Description</TableCell>}
                {isVisible('documentation_url') && <TableCell>Documentation</TableCell>}
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
              ) : technologies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumnCount} align="center" sx={{ py: 4 }}>
                    No technologies found
                  </TableCell>
                </TableRow>
              ) : (
                technologies.map((tech) => (
                  <TableRow key={tech.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/technologies/${tech.id}`)}>
                    {isVisible('name') && (
                      <TableCell>
                        <Typography fontWeight={500}>{tech.name}</Typography>
                      </TableCell>
                    )}
                    {isVisible('version') && (
                      <TableCell>{tech.version || '-'}</TableCell>
                    )}
                    {isVisible('category') && (
                      <TableCell>
                        <Chip label={tech.category} size="small" variant="outlined" />
                      </TableCell>
                    )}
                    {isVisible('status') && (
                      <TableCell>
                        <Chip
                          label={tech.status}
                          size="small"
                          color={STATUS_COLORS[tech.status]}
                        />
                      </TableCell>
                    )}
                    {isVisible('end_of_life_date') && (
                      <TableCell>
                        {tech.end_of_life_date ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {isEndOfLife(tech.end_of_life_date) && (
                              <WarningIcon color="error" fontSize="small" />
                            )}
                            {new Date(tech.end_of_life_date).toLocaleDateString()}
                          </Box>
                        ) : '-'}
                      </TableCell>
                    )}
                    {isVisible('description') && (
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tech.description || '-'}
                        </Typography>
                      </TableCell>
                    )}
                    {isVisible('documentation_url') && (
                      <TableCell>
                        {tech.documentation_url ? (
                          <a href={tech.documentation_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            Link
                          </a>
                        ) : '-'}
                      </TableCell>
                    )}
                    {/* Custom attribute values */}
                    {customAttributes.filter(attr => attr.is_active && isVisible(`custom_${attr.id}`)).map(attr => (
                      <TableCell key={attr.id}>
                        {getCustomValue(tech.id, attr.id)}
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/technologies/${tech.id}?edit=true`); }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => { e.stopPropagation(); handleDelete(tech.id); }}
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
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>
    </Box>
  );
}
