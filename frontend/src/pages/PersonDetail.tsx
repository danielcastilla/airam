import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { personsApi } from '../services/api';
import { PersonRole } from '../types';

interface PersonFormData {
  name: string;
  email: string;
  phone: string;
  role: PersonRole;
  department: string;
}

const initialFormData: PersonFormData = {
  name: '',
  email: '',
  phone: '',
  role: PersonRole.DEVELOPER,
  department: '',
};

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  const [formData, setFormData] = useState<PersonFormData>(initialFormData);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      fetchPerson(id);
    }
  }, [id, isNew]);

  const fetchPerson = async (personId: string) => {
    setLoading(true);
    try {
      const response = await personsApi.getById(personId);
      const person = response.data.data;
      setFormData({
        name: person.name || '',
        email: person.email || '',
        phone: person.phone || '',
        role: person.role || PersonRole.DEVELOPER,
        department: person.department || '',
      });
    } catch (err: any) {
      setError('Failed to load person data');
      console.error('Failed to fetch person:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof PersonFormData) => (
    e: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        await personsApi.create(formData as unknown as Record<string, unknown>);
      } else {
        await personsApi.update(id!, formData as unknown as Record<string, unknown>);
      }
      navigate('/persons');
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isNew ? 'create' : 'update'} person`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/persons')}
        sx={{ mb: 2 }}
        size="small"
      >
        Back to Persons
      </Button>

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            {isNew ? 'Create New Person' : 'Edit Person'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={handleChange('name')}
                required
                error={!formData.name.trim() && !!error}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                required
                error={!formData.email.trim() && !!error}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={handleChange('phone')}
                placeholder="+34 600 000 000"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as PersonRole })}
                >
                  {Object.values(PersonRole).map((role) => (
                    <MenuItem key={role} value={role}>
                      {role.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={handleChange('department')}
                placeholder="IT, Operations, Finance..."
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/persons')}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : isNew ? 'Create Person' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
