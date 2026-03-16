import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  ArrowForward as ArrowIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { dependenciesApi, applicationsApi, customAttributesApi } from '../services/api';
import { Dependency, DependencyType, Application } from '../types';
import CustomAttributesDisplay, { useCustomAttributes } from '../components/CustomAttributesDisplay';

export default function DependencyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dependency, setDependency] = useState<Dependency | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [formData, setFormData] = useState({
    source_application_id: '',
    target_application_id: '',
    dependency_type: 'RUNTIME' as DependencyType,
    description: '',
    is_critical: false,
  });

  const isNew = id === 'new';
  const entityId = isNew ? 0 : parseInt(id || '0');

  // Custom attributes
  const {
    values: customValues,
    setValues: setCustomValues,
    loading: customLoading,
  } = useCustomAttributes('DEPENDENCY', entityId);

  useEffect(() => {
    fetchDropdownData();
    if (isNew) {
      setLoading(false);
      setIsEditing(true);
      return;
    }
    fetchDependency();
  }, [id]);

  const fetchDropdownData = async () => {
    try {
      const response = await applicationsApi.getAll({ limit: 1000 });
      setApplications(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  const fetchDependency = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await dependenciesApi.getById(id);
      const data = response.data.data;
      setDependency(data);
      setFormData({
        source_application_id: data.source_application_id?.toString() || '',
        target_application_id: data.target_application_id?.toString() || '',
        dependency_type: data.dependency_type || 'RUNTIME',
        description: data.description || '',
        is_critical: data.is_critical || false,
      });
    } catch (error) {
      console.error('Failed to fetch dependency:', error);
      setError('Failed to load dependency');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        source_application_id: parseInt(formData.source_application_id),
        target_application_id: parseInt(formData.target_application_id),
      };

      if (isNew) {
        const response = await dependenciesApi.create(payload);
        const newId = response.data.data.id;
        // Save custom attributes
        if (Object.keys(customValues).length > 0) {
          await customAttributesApi.setValues('DEPENDENCY', newId, customValues);
        }
        navigate(`/dependencies/${newId}`);
      } else {
        await dependenciesApi.update(id!, payload);
        // Save custom attributes
        if (Object.keys(customValues).length > 0) {
          await customAttributesApi.setValues('DEPENDENCY', entityId, customValues);
        }
        await fetchDependency();
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error('Failed to save dependency:', error);
      setError(error.response?.data?.error || 'Failed to save dependency');
    } finally {
      setSaving(false);
    }
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
        <IconButton onClick={() => navigate('/dependencies')}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={700}>
            {isNew ? 'New Dependency' : isEditing ? 'Edit Dependency' : 'Dependency Details'}
          </Typography>
          {!isNew && dependency && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Chip
                label={dependency.source_application_name}
                size="small"
                variant="outlined"
              />
              <ArrowIcon fontSize="small" color="action" />
              <Chip
                label={dependency.target_application_name}
                size="small"
                variant="outlined"
              />
              <Chip
                label={dependency.dependency_type}
                size="small"
                sx={{ ml: 1 }}
              />
              {dependency.is_critical && (
                <Chip
                  icon={<WarningIcon />}
                  label="Critical"
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
                Dependency Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {isEditing ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Source Application</InputLabel>
                      <Select
                        value={formData.source_application_id}
                        label="Source Application"
                        onChange={(e) => setFormData({ ...formData, source_application_id: e.target.value })}
                      >
                        {applications.map((app) => (
                          <MenuItem key={app.id} value={app.id.toString()}>
                            {app.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Target Application</InputLabel>
                      <Select
                        value={formData.target_application_id}
                        label="Target Application"
                        onChange={(e) => setFormData({ ...formData, target_application_id: e.target.value })}
                      >
                        {applications.map((app) => (
                          <MenuItem key={app.id} value={app.id.toString()}>
                            {app.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Dependency Type</InputLabel>
                      <Select
                        value={formData.dependency_type}
                        label="Dependency Type"
                        onChange={(e) => setFormData({ ...formData, dependency_type: e.target.value as DependencyType })}
                      >
                        {Object.values(DependencyType).map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.is_critical}
                          onChange={(e) => setFormData({ ...formData, is_critical: e.target.checked })}
                        />
                      }
                      label="Critical Dependency"
                      sx={{ mt: 1 }}
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
                      Source Application
                    </Typography>
                    <Box>
                      <Chip
                        label={dependency?.source_application_name}
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/applications/${dependency?.source_application_id}`)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Target Application
                    </Typography>
                    <Box>
                      <Chip
                        label={dependency?.target_application_name}
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/applications/${dependency?.target_application_id}`)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Dependency Type
                    </Typography>
                    <Box>
                      <Chip label={dependency?.dependency_type} size="small" />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Critical
                    </Typography>
                    <Box>
                      {dependency?.is_critical ? (
                        <Chip
                          icon={<WarningIcon />}
                          label="Yes"
                          size="small"
                          color="error"
                        />
                      ) : (
                        <Typography>No</Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Description
                    </Typography>
                    <Typography>{dependency?.description || '-'}</Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Custom Attributes */}
          {!isNew && (
            <CustomAttributesDisplay
              entityType="DEPENDENCY"
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
                    navigate('/dependencies');
                  } else {
                    setIsEditing(false);
                    fetchDependency();
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving || !formData.source_application_id || !formData.target_application_id}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          )}
        </Grid>

        {/* Sidebar - Metadata */}
        {!isNew && dependency && (
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Metadata
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Created At
                    </Typography>
                    <Typography>
                      {new Date(dependency.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Updated At
                    </Typography>
                    <Typography>
                      {new Date(dependency.updated_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
