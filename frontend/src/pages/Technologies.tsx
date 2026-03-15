import { useState, useEffect } from 'react';
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
import { technologiesApi } from '../services/api';
import { Technology, TechnologyStatus } from '../types';

const STATUS_COLORS: Record<TechnologyStatus, 'success' | 'warning' | 'error' | 'info'> = {
  ACTIVE: 'success',
  DEPRECATED: 'warning',
  OBSOLETE: 'error',
  EMERGING: 'info',
};

export default function Technologies() {
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchTechnologies();
    fetchCategories();
  }, [page, rowsPerPage, search, statusFilter, categoryFilter]);

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
      setTechnologies(response.data.data);
      setTotal(response.data.total);
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
        await technologiesApi.delete(id);
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Technologies
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage technology stack and versions
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>
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
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
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
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>End of Life</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : technologies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No technologies found
                  </TableCell>
                </TableRow>
              ) : (
                technologies.map((tech) => (
                  <TableRow key={tech.id} hover>
                    <TableCell>
                      <Typography fontWeight={500}>{tech.name}</Typography>
                      {tech.description && (
                        <Typography variant="caption" color="text.secondary">
                          {tech.description.substring(0, 50)}...
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{tech.version || '-'}</TableCell>
                    <TableCell>
                      <Chip label={tech.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tech.status}
                        size="small"
                        color={STATUS_COLORS[tech.status]}
                      />
                    </TableCell>
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
                    <TableCell align="right">
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(tech.id)}
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
