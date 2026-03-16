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
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowForward as ArrowIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { dependenciesApi, customAttributesApi, CustomAttributeDefinition } from '../services/api';
import { Dependency } from '../types';
import ColumnSelector, { ColumnDefinition, useColumnVisibility } from '../components/ColumnSelector';

// Default columns definition
const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { id: 'source_target', label: 'Source → Target', defaultVisible: true },
  { id: 'dependency_type', label: 'Type', defaultVisible: true },
  { id: 'description', label: 'Description', defaultVisible: true },
  { id: 'is_critical', label: 'Critical', defaultVisible: true },
];

export default function Dependencies() {
  const navigate = useNavigate();
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
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
    fetchDependencies();
  }, [page, rowsPerPage]);

  const loadCustomAttributes = async () => {
    try {
      const response = await customAttributesApi.getTemplate('DEPENDENCY');
      setCustomAttributes(response.data.data.attributes || []);
    } catch (error) {
      console.error('Failed to load custom attributes:', error);
    }
  };

  const fetchDependencies = async () => {
    setLoading(true);
    try {
      const response = await dependenciesApi.getAll({
        page: page + 1,
        limit: rowsPerPage,
      });
      const deps = response.data.data;
      setDependencies(deps);
      setTotal(response.data.total);

      // Load custom values for visible custom columns
      const visibleCustomCols = Array.from(visibleColumns).filter(id => id.startsWith('custom_'));
      if (visibleCustomCols.length > 0 && deps.length > 0) {
        const valuesMap: Record<number, Record<string, any>> = {};
        await Promise.all(
          deps.map(async (dep: Dependency) => {
            try {
              const res = await customAttributesApi.getValues('DEPENDENCY', dep.id);
              valuesMap[dep.id] = res.data.data || {};
            } catch {
              valuesMap[dep.id] = {};
            }
          })
        );
        setCustomValues(valuesMap);
      }
    } catch (error) {
      console.error('Failed to fetch dependencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this dependency?')) {
      try {
        await dependenciesApi.delete(String(id));
        fetchDependencies();
      } catch (error) {
        console.error('Failed to delete dependency:', error);
      }
    }
  };

  const getCustomValue = (depId: number, attrId: number) => {
    const attr = customAttributes.find(a => a.id === attrId);
    if (!attr) return '-';
    const values = customValues[depId] || {};
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
            Dependencies
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage system dependencies
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }} onClick={() => navigate('/dependencies/new')}>
          Add Dependency
        </Button>
      </Box>

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
                {isVisible('source_target') && <TableCell>Source → Target</TableCell>}
                {isVisible('dependency_type') && <TableCell>Type</TableCell>}
                {isVisible('description') && <TableCell>Description</TableCell>}
                {isVisible('is_critical') && <TableCell>Critical</TableCell>}
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
              ) : dependencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumnCount} align="center" sx={{ py: 4 }}>
                    No dependencies found
                  </TableCell>
                </TableRow>
              ) : (
                dependencies.map((dep) => (
                  <TableRow key={dep.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/dependencies/${dep.id}`)}>
                    {isVisible('source_target') && (
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={dep.source_application_name} size="small" variant="outlined" />
                          <ArrowIcon fontSize="small" color="action" />
                          <Chip label={dep.target_application_name} size="small" variant="outlined" />
                        </Box>
                      </TableCell>
                    )}
                    {isVisible('dependency_type') && (
                      <TableCell>
                        <Chip label={dep.dependency_type} size="small" />
                      </TableCell>
                    )}
                    {isVisible('description') && (
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {dep.description || '-'}
                        </Typography>
                      </TableCell>
                    )}
                    {isVisible('is_critical') && (
                      <TableCell>
                        {dep.is_critical && (
                          <Chip
                            icon={<WarningIcon />}
                            label="Critical"
                            size="small"
                            color="error"
                          />
                        )}
                      </TableCell>
                    )}
                    {/* Custom attribute values */}
                    {customAttributes.filter(attr => attr.is_active && isVisible(`custom_${attr.id}`)).map(attr => (
                      <TableCell key={attr.id}>
                        {getCustomValue(dep.id, attr.id)}
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/dependencies/${dep.id}?edit=true`); }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => { e.stopPropagation(); handleDelete(dep.id); }}
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
