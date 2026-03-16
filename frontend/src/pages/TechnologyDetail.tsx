import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  IconButton,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Code as AppIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { technologiesApi, customAttributesApi } from '../services/api';
import { Technology, TechnologyStatus, Application } from '../types';
import CustomAttributesDisplay, { useCustomAttributes } from '../components/CustomAttributesDisplay';

const STATUS_COLORS: Record<TechnologyStatus, 'success' | 'warning' | 'error' | 'info'> = {
  ACTIVE: 'success',
  DEPRECATED: 'warning',
  OBSOLETE: 'error',
  EMERGING: 'info',
};

export default function TechnologyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [technology, setTechnology] = useState<Technology | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [formData, setFormData] = useState({
    name: '',
    version: '',
    category: '',
    status: 'ACTIVE' as TechnologyStatus,
    end_of_life_date: '',
    description: '',
    documentation_url: '',
  });

  const isNew = id === 'new';
  const entityId = isNew ? 0 : parseInt(id || '0');

  // Custom attributes
  const {
    values: customValues,
    setValues: setCustomValues,
    loading: customLoading,
  } = useCustomAttributes('TECHNOLOGY', entityId);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      setIsEditing(true);
      return;
    }
    fetchTechnology();
  }, [id]);

  const fetchTechnology = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await technologiesApi.getById(id);
      const data = response.data.data;
      setTechnology(data);
      setFormData({
        name: data.name || '',
        version: data.version || '',
        category: data.category || '',
        status: data.status || 'ACTIVE',
        end_of_life_date: data.end_of_life_date ? data.end_of_life_date.split('T')[0] : '',
        description: data.description || '',
        documentation_url: data.documentation_url || '',
      });

      // Fetch applications using this technology
      try {
        const appsResponse = await technologiesApi.getApplications(id);
        setApplications(appsResponse.data.data || []);
      } catch (e) {
        console.error('Failed to fetch applications:', e);
      }
    } catch (error) {
      console.error('Failed to fetch technology:', error);
      setError('Failed to load technology');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const response = await technologiesApi.create(formData);
        const newId = response.data.data.id;
        // Save custom attributes
        if (Object.keys(customValues).length > 0) {
          await customAttributesApi.setValues('TECHNOLOGY', newId, customValues);
        }
        navigate(`/technologies/${newId}`);
      } else {
        await technologiesApi.update(id!, formData);
        // Save custom attributes
        if (Object.keys(customValues).length > 0) {
          await customAttributesApi.setValues('TECHNOLOGY', entityId, customValues);
        }
        await fetchTechnology();
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error('Failed to save technology:', error);
      setError(error.response?.data?.error || 'Failed to save technology');
    } finally {
      setSaving(false);
    }
  };

  const isEndOfLife = (date?: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  if (loading || customLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/technologies')}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={700}>
            {isNew ? 'New Technology' : isEditing ? `Edit ${technology?.name}` : technology?.name}
          </Typography>
          {!isNew && technology && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip
                label={technology.status}
                size="small"
                color={STATUS_COLORS[technology.status]}
              />
              <Chip
                label={technology.category}
                size="small"
                variant="outlined"
              />
              {technology.version && (
                <Chip
                  label={`v${technology.version}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {isEndOfLife(technology.end_of_life_date) && (
                <Chip
                  label="End of Life"
                  size="small"
                  color="error"
                />
              )}
            </Box>
          )}
        </Box>
        {!isNew && !isEditing && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Form / Details */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Technology Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {isEditing ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Version"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      placeholder="e.g., Programming Language, Database, Framework"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={formData.status}
                        label="Status"
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as TechnologyStatus })}
                      >
                        {Object.values(TechnologyStatus).map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="End of Life Date"
                      type="date"
                      value={formData.end_of_life_date}
                      onChange={(e) => setFormData({ ...formData, end_of_life_date: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Documentation URL"
                      value={formData.documentation_url}
                      onChange={(e) => setFormData({ ...formData, documentation_url: e.target.value })}
                      type="url"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      multiline
                      rows={4}
                    />
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Name
                    </Typography>
                    <Typography>{technology?.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Version
                    </Typography>
                    <Typography>{technology?.version || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Category
                    </Typography>
                    <Typography>{technology?.category}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box>
                      <Chip
                        label={technology?.status}
                        size="small"
                        color={STATUS_COLORS[technology?.status || 'ACTIVE']}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      End of Life Date
                    </Typography>
                    <Typography>
                      {technology?.end_of_life_date
                        ? new Date(technology.end_of_life_date).toLocaleDateString()
                        : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Documentation
                    </Typography>
                    {technology?.documentation_url ? (
                      <Box>
                        <Button
                          size="small"
                          startIcon={<LinkIcon />}
                          href={technology.documentation_url}
                          target="_blank"
                        >
                          View Docs
                        </Button>
                      </Box>
                    ) : (
                      <Typography>-</Typography>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Description
                    </Typography>
                    <Typography>{technology?.description || '-'}</Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Custom Attributes */}
          {!isNew && (
            <CustomAttributesDisplay
              entityType="TECHNOLOGY"
              entityId={entityId}
              isEditing={isEditing}
              values={customValues}
              onChange={setCustomValues}
            />
          )}

          {/* Actions */}
          {isEditing && (
            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  if (isNew) {
                    navigate('/technologies');
                  } else {
                    setIsEditing(false);
                    fetchTechnology();
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          )}
        </Grid>

        {/* Sidebar - Applications using this technology */}
        {!isNew && (
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <AppIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Applications
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Applications using this technology
                </Typography>
                <Divider sx={{ my: 2 }} />

                {applications.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No applications found
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {applications.map((app) => (
                          <TableRow
                            key={app.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/applications/${app.id}`)}
                          >
                            <TableCell>{app.name}</TableCell>
                            <TableCell>
                              <Chip label={app.type} size="small" variant="outlined" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
