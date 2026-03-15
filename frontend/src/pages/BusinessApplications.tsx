import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { businessApplicationsApi } from '../services/api';
import { BusinessApplication, BusinessDomain, BusinessCriticality } from '../types';

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

  useEffect(() => {
    fetchBusinessApps();
  }, [page, rowsPerPage, search, domainFilter, criticalityFilter]);

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
      setBusinessApps(response.data.data);
      setTotal(response.data.total || 0);
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
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
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
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
          <FormControl size="small" sx={{ minWidth: 180 }}>
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
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Criticality</TableCell>
                <TableCell>Business Owner</TableCell>
                <TableCell>Capability</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Loading...</TableCell>
                </TableRow>
              ) : businessApps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">No business applications found</TableCell>
                </TableRow>
              ) : (
                businessApps.map((app) => (
                  <TableRow 
                    key={app.id} 
                    hover 
                    onClick={() => navigate(`/business-applications/${app.id}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon color="primary" fontSize="small" />
                        <Typography fontWeight={500}>{app.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        sx={{ 
                          maxWidth: 300, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }}
                      >
                        {app.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={app.business_domain.replace('_', ' ')}
                        color={DOMAIN_COLORS[app.business_domain]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={app.business_criticality}
                        color={CRITICALITY_COLORS[app.business_criticality]}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {app.business_owner && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" color="action" />
                          {app.business_owner}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{app.business_capability}</TableCell>
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
