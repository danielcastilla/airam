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
} from '@mui/icons-material';
import { interfacesApi, customAttributesApi, CustomAttributeDefinition } from '../services/api';
import { SystemInterface, BusinessCriticality } from '../types';
import ColumnSelector, { ColumnDefinition, useColumnVisibility } from '../components/ColumnSelector';

const CRITICALITY_COLORS: Record<BusinessCriticality, 'error' | 'warning' | 'primary' | 'success'> = {
  CRITICAL: 'error',
  HIGH: 'warning',
  MEDIUM: 'primary',
  LOW: 'success',
};

// Default columns definition
const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { id: 'name', label: 'Name', defaultVisible: true },
  { id: 'source_target', label: 'Source → Target', defaultVisible: true },
  { id: 'integration_type', label: 'Type', defaultVisible: true },
  { id: 'technology_name', label: 'Technology', defaultVisible: false },
  { id: 'criticality', label: 'Criticality', defaultVisible: true },
  { id: 'description', label: 'Description', defaultVisible: false },
  { id: 'data_format', label: 'Data Format', defaultVisible: false },
  { id: 'frequency', label: 'Frequency', defaultVisible: false },
];

export default function Interfaces() {
  const navigate = useNavigate();
  const [interfaces, setInterfaces] = useState<SystemInterface[]>([]);
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
    fetchInterfaces();
  }, [page, rowsPerPage]);

  const loadCustomAttributes = async () => {
    try {
      const response = await customAttributesApi.getTemplate('INTERFACE');
      setCustomAttributes(response.data.data.attributes || []);
    } catch (error) {
      console.error('Failed to load custom attributes:', error);
    }
  };

  const fetchInterfaces = async () => {
    setLoading(true);
    try {
      const response = await interfacesApi.getAll({
        page: page + 1,
        limit: rowsPerPage,
      });
      const ifaces = response.data.data;
      setInterfaces(ifaces);
      setTotal(response.data.total);

      // Load custom values for visible custom columns
      const visibleCustomCols = Array.from(visibleColumns).filter(id => id.startsWith('custom_'));
      if (visibleCustomCols.length > 0 && ifaces.length > 0) {
        const valuesMap: Record<number, Record<string, any>> = {};
        await Promise.all(
          ifaces.map(async (iface: SystemInterface) => {
            try {
              const res = await customAttributesApi.getValues('INTERFACE', iface.id);
              valuesMap[iface.id] = res.data.data || {};
            } catch {
              valuesMap[iface.id] = {};
            }
          })
        );
        setCustomValues(valuesMap);
      }
    } catch (error) {
      console.error('Failed to fetch interfaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this interface?')) {
      try {
        await interfacesApi.delete(String(id));
        fetchInterfaces();
      } catch (error) {
        console.error('Failed to delete interface:', error);
      }
    }
  };

  const getCustomValue = (ifaceId: number, attrId: number) => {
    const attr = customAttributes.find(a => a.id === attrId);
    if (!attr) return '-';
    const values = customValues[ifaceId] || {};
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
            System Interfaces
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage integrations between systems
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }} onClick={() => navigate('/interfaces/new')}>
          Add Interface
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
                {isVisible('name') && <TableCell>Name</TableCell>}
                {isVisible('source_target') && <TableCell>Source → Target</TableCell>}
                {isVisible('integration_type') && <TableCell>Type</TableCell>}
                {isVisible('technology_name') && <TableCell>Technology</TableCell>}
                {isVisible('criticality') && <TableCell>Criticality</TableCell>}
                {isVisible('description') && <TableCell>Description</TableCell>}
                {isVisible('data_format') && <TableCell>Data Format</TableCell>}
                {isVisible('frequency') && <TableCell>Frequency</TableCell>}
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
              ) : interfaces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumnCount} align="center" sx={{ py: 4 }}>
                    No interfaces found
                  </TableCell>
                </TableRow>
              ) : (
                interfaces.map((iface) => (
                  <TableRow key={iface.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/interfaces/${iface.id}`)}>
                    {isVisible('name') && (
                      <TableCell>
                        <Typography fontWeight={500}>{iface.name}</Typography>
                      </TableCell>
                    )}
                    {isVisible('source_target') && (
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={iface.source_application_name} size="small" variant="outlined" />
                          <ArrowIcon fontSize="small" color="action" />
                          <Chip label={iface.target_application_name} size="small" variant="outlined" />
                        </Box>
                      </TableCell>
                    )}
                    {isVisible('integration_type') && (
                      <TableCell>
                        <Chip label={iface.integration_type} size="small" />
                      </TableCell>
                    )}
                    {isVisible('technology_name') && (
                      <TableCell>{iface.technology_name || '-'}</TableCell>
                    )}
                    {isVisible('criticality') && (
                      <TableCell>
                        <Chip
                          label={iface.criticality}
                          size="small"
                          color={CRITICALITY_COLORS[iface.criticality]}
                        />
                      </TableCell>
                    )}
                    {isVisible('description') && (
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {iface.description || '-'}
                        </Typography>
                      </TableCell>
                    )}
                    {isVisible('data_format') && (
                      <TableCell>{iface.data_format || '-'}</TableCell>
                    )}
                    {isVisible('frequency') && (
                      <TableCell>{iface.frequency || '-'}</TableCell>
                    )}
                    {/* Custom attribute values */}
                    {customAttributes.filter(attr => attr.is_active && isVisible(`custom_${attr.id}`)).map(attr => (
                      <TableCell key={attr.id}>
                        {getCustomValue(iface.id, attr.id)}
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/interfaces/${iface.id}?edit=true`); }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => { e.stopPropagation(); handleDelete(iface.id); }}
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
