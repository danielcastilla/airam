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
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { personsApi } from '../services/api';
import { Person, PersonRole } from '../types';

const ROLE_COLORS: Record<PersonRole, 'primary' | 'secondary' | 'success' | 'warning' | 'info'> = {
  FUNCTIONAL_OWNER: 'primary',
  TECHNICAL_OWNER: 'secondary',
  MAINTENANCE_TEAM: 'success',
  ARCHITECT: 'warning',
  DEVELOPER: 'info',
};

export default function Persons() {
  const navigate = useNavigate();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  useEffect(() => {
    fetchPersons();
  }, [page, rowsPerPage, search, roleFilter]);

  const fetchPersons = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const response = await personsApi.getAll(params);
      setPersons(response.data.data);
      setTotal(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch persons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this person?')) return;
    try {
      await personsApi.delete(id);
      fetchPersons();
    } catch (error) {
      console.error('Failed to delete person:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Persons
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage responsible persons and teams
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/persons/new')}
        >
          Add Person
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search persons..."
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
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="">All Roles</MenuItem>
              {Object.values(PersonRole).map((role) => (
                <MenuItem key={role} value={role}>{role.replace('_', ' ')}</MenuItem>
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
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Loading...</TableCell>
                </TableRow>
              ) : persons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No persons found</TableCell>
                </TableRow>
              ) : (
                persons.map((person) => (
                  <TableRow key={person.id} hover>
                    <TableCell>
                      <Typography fontWeight={500}>{person.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <a href={`mailto:${person.email}`}>{person.email}</a>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {person.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          {person.phone}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={person.role.replace('_', ' ')}
                        color={ROLE_COLORS[person.role]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{person.department}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => navigate(`/persons/${person.id}`)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(person.id)}>
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
