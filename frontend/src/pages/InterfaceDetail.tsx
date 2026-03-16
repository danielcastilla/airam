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
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { interfacesApi, applicationsApi, technologiesApi, customAttributesApi } from '../services/api';
import { SystemInterface, IntegrationType, BusinessCriticality, Application, Technology } from '../types';
import CustomAttributesDisplay, { useCustomAttributes } from '../components/CustomAttributesDisplay';

const CRITICALITY_COLORS: Record<BusinessCriticality, 'error' | 'warning' | 'primary' | 'success'> = {
  CRITICAL: 'error',
  HIGH: 'warning',
  MEDIUM: 'primary',
  LOW: 'success',
};

export default function InterfaceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [iface, setIface] = useState<SystemInterface | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [formData, setFormData] = useState({
    name: '',
    source_application_id: '',
    target_application_id: '',
    integration_type: 'REST_API' as IntegrationType,
    technology_id: '',
    description: '',
    criticality: 'MEDIUM' as BusinessCriticality,
    data_format: '',
    frequency: '',
  });

  const isNew = id === 'new';
  const entityId = isNew ? 0 : parseInt(id || '0');

  // Custom attributes
  const {
    values: customValues,
    setValues: setCustomValues,
    loading: customLoading,
  } = useCustomAttributes('INTERFACE', entityId);

  useEffect(() => {
    fetchDropdownData();
    if (isNew) {
      setLoading(false);
      setIsEditing(true);
      return;
    }
    fetchInterface();
  }, [id]);

  const fetchDropdownData = async () => {
    try {
      const [appsResponse, techResponse] = await Promise.all([
        applicationsApi.getAll({ limit: 1000 }),
        technologiesApi.getAll({ limit: 1000 }),
      ]);
      setApplications(appsResponse.data.data || []);
      setTechnologies(techResponse.data.data || []);
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  };

  const fetchInterface = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await interfacesApi.getById(id);
      const data = response.data.data;
      setIface(data);
      setFormData({
        name: data.name || '',
        source_application_id: data.source_application_id?.toString() || '',
        target_application_id: data.target_application_id?.toString() || '',
        integration_type: data.integration_type || 'REST_API',
        technology_id: data.technology_id?.toString() || '',
        description: data.description || '',
        criticality: data.criticality || 'MEDIUM',
        data_format: data.data_format || '',
        frequency: data.frequency || '',
      });
    } catch (error) {
      console.error('Failed to fetch interface:', error);
      setError('Failed to load interface');
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
        technology_id: formData.technology_id ? parseInt(formData.technology_id) : null,
      };

      if (isNew) {
        const response = await interfacesApi.create(payload);
        const newId = response.data.data.id;
        // Save custom attributes
        if (Object.keys(customValues).length > 0) {
          await customAttributesApi.setValues('INTERFACE', newId, customValues);
        }
        navigate(`/interfaces/${newId}`);
      } else {
        await interfacesApi.update(id!, payload);
        // Save custom attributes
        if (Object.keys(customValues).length > 0) {
          await customAttributesApi.setValues('INTERFACE', entityId, customValues);
        }
        await fetchInterface();
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error('Failed to save interface:', error);
      setError(error.response?.data?.error || 'Failed to save interface');
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
        <IconButton onClick={() => navigate('/interfaces')}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={700}>
            {isNew ? 'New Interface' : isEditing ? `Edit ${iface?.name}` : iface?.name}
          </Typography>
          {!isNew && iface && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Chip
                label={iface.source_application_name}
                size="small"
                variant="outlined"
              />
              <ArrowIcon fontSize="small" color="action" />
              <Chip
                label={iface.target_application_name}
                size="small"
                variant="outlined"
              />
              <Chip
                label={iface.criticality}
                size="small"
                color={CRITICALITY_COLORS[iface.criticality]}
                sx={{ ml: 1 }}
              />
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
                Interface Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {isEditing ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </Grid>
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
                      <InputLabel>Integration Type</InputLabel>
                      <Select
                        value={formData.integration_type}
                        label="Integration Type"
                        onChange={(e) => setFormData({ ...formData, integration_type: e.target.value as IntegrationType })}
                      >
                        {Object.values(IntegrationType).map((type) => (
                          <MenuItem key={type} value={type}>
                            {type.replace(/_/g, ' ')}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Technology</InputLabel>
                      <Select
                        value={formData.technology_id}
                        label="Technology"
                        onChange={(e) => setFormData({ ...formData, technology_id: e.target.value })}
                      >
                        <MenuItem value="">None</MenuItem>
                        {technologies.map((tech) => (
                          <MenuItem key={tech.id} value={tech.id.toString()}>
                            {tech.name} {tech.version ? `v${tech.version}` : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Criticality</InputLabel>
                      <Select
                        value={formData.criticality}
                        label="Criticality"
                        onChange={(e) => setFormData({ ...formData, criticality: e.target.value as BusinessCriticality })}
                      >
                        {Object.values(BusinessCriticality).map((crit) => (
                          <MenuItem key={crit} value={crit}>
                            {crit}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Data Format"
                      value={formData.data_format}
                      onChange={(e) => setFormData({ ...formData, data_format: e.target.value })}
                      placeholder="e.g., JSON, XML, CSV"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Frequency"
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      placeholder="e.g., Real-time, Daily, Hourly"
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
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Name
                    </Typography>
                    <Typography>{iface?.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Source Application
                    </Typography>
                    <Box>
                      <Chip
                        label={iface?.source_application_name}
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/applications/${iface?.source_application_id}`)}
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
                        label={iface?.target_application_name}
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/applications/${iface?.target_application_id}`)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Integration Type
                    </Typography>
                    <Box>
                      <Chip
                        label={iface?.integration_type?.replace(/_/g, ' ')}
                        size="small"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Technology
                    </Typography>
                    <Typography>
                      {iface?.technology_name || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Criticality
                    </Typography>
                    <Box>
                      <Chip
                        label={iface?.criticality}
                        size="small"
                        color={CRITICALITY_COLORS[iface?.criticality || 'MEDIUM']}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Data Format
                    </Typography>
                    <Typography>{iface?.data_format || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Frequency
                    </Typography>
                    <Typography>{iface?.frequency || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Description
                    </Typography>
                    <Typography>{iface?.description || '-'}</Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Custom Attributes */}
          {!isNew && (
            <CustomAttributesDisplay
              entityType="INTERFACE"
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
                    navigate('/interfaces');
                  } else {
                    setIsEditing(false);
                    fetchInterface();
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving || !formData.name || !formData.source_application_id || !formData.target_application_id}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          )}
        </Grid>

        {/* Sidebar - Metadata */}
        {!isNew && iface && (
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
                      {new Date(iface.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Updated At
                    </Typography>
                    <Typography>
                      {new Date(iface.updated_at).toLocaleDateString()}
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
