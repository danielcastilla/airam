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
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { interfacesApi } from '../services/api';
import { SystemInterface, BusinessCriticality } from '../types';

const CRITICALITY_COLORS: Record<BusinessCriticality, 'error' | 'warning' | 'primary' | 'success'> = {
  CRITICAL: 'error',
  HIGH: 'warning',
  MEDIUM: 'primary',
  LOW: 'success',
};

export default function Interfaces() {
  const [interfaces, setInterfaces] = useState<SystemInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchInterfaces();
  }, [page, rowsPerPage]);

  const fetchInterfaces = async () => {
    setLoading(true);
    try {
      const response = await interfacesApi.getAll({
        page: page + 1,
        limit: rowsPerPage,
      });
      setInterfaces(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch interfaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this interface?')) {
      try {
        await interfacesApi.delete(id);
        fetchInterfaces();
      } catch (error) {
        console.error('Failed to delete interface:', error);
      }
    }
  };

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
        <Button variant="contained" startIcon={<AddIcon />} sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>
          Add Interface
        </Button>
      </Box>

      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Source → Target</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Type</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Technology</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Criticality</TableCell>
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
              ) : interfaces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No interfaces found
                  </TableCell>
                </TableRow>
              ) : (
                interfaces.map((iface) => (
                  <TableRow key={iface.id} hover>
                    <TableCell>
                      <Typography fontWeight={500}>{iface.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={iface.source_application_name} size="small" variant="outlined" />
                        <ArrowIcon fontSize="small" color="action" />
                        <Chip label={iface.target_application_name} size="small" variant="outlined" />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Chip label={iface.integration_type} size="small" />
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{iface.technology_name || '-'}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Chip
                        label={iface.criticality}
                        size="small"
                        color={CRITICALITY_COLORS[iface.criticality]}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(iface.id)}
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
