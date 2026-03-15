import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Apps as AppsIcon,
} from '@mui/icons-material';
import { businessApplicationsApi } from '../services/api';
import { BusinessDomain, BusinessCriticality, Application } from '../types';

interface BusinessAppFormData {
  name: string;
  description: string;
  business_domain: BusinessDomain;
  business_criticality: BusinessCriticality;
  business_owner: string;
  business_owner_email: string;
  business_capability: string;
  strategic_value: string;
}

const initialFormData: BusinessAppFormData = {
  name: '',
  description: '',
  business_domain: BusinessDomain.OTHER,
  business_criticality: BusinessCriticality.MEDIUM,
  business_owner: '',
  business_owner_email: '',
  business_capability: '',
  strategic_value: '',
};

const CRITICALITY_COLORS: Record<BusinessCriticality, 'error' | 'warning' | 'info' | 'default'> = {
  CRITICAL: 'error',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'default',
};

export default function BusinessApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const editMode = searchParams.get('edit') === 'true';
  
  const [formData, setFormData] = useState<BusinessAppFormData>(initialFormData);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(isNew || editMode);
  const [linkedApps, setLinkedApps] = useState<Application[]>([]);

  useEffect(() => {
    if (!isNew && id) {
      fetchBusinessApp(id);
      fetchLinkedApps(id);
    }
  }, [id, isNew]);

  const fetchBusinessApp = async (appId: string) => {
    setLoading(true);
    try {
      const response = await businessApplicationsApi.getById(appId);
      const app = response.data.data;
      setFormData({
        name: app.name || '',
        description: app.description || '',
        business_domain: app.business_domain || BusinessDomain.OTHER,
        business_criticality: app.business_criticality || BusinessCriticality.MEDIUM,
        business_owner: app.business_owner || '',
        business_owner_email: app.business_owner_email || '',
        business_capability: app.business_capability || '',
        strategic_value: app.strategic_value || '',
      });
    } catch (err: any) {
      setError('Failed to load business application data');
      console.error('Failed to fetch business application:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedApps = async (appId: string) => {
    try {
      const response = await businessApplicationsApi.getLinkedApplications(appId);
      setLinkedApps(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch linked applications:', err);
    }
  };

  const handleChange = (field: keyof BusinessAppFormData) => (
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
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        await businessApplicationsApi.create({ ...formData });
      } else {
        await businessApplicationsApi.update(id!, { ...formData });
      }
      navigate('/business-applications');
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isNew ? 'create' : 'update'} business application`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/business-applications');
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
        onClick={() => navigate('/business-applications')}
        sx={{ mb: 2 }}
      >
        Back to Business Applications
      </Button>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" fontWeight={700}>
              {isNew ? 'Create New Business Application' : isEditing ? 'Edit Business Application' : formData.name}
            </Typography>
            {!isNew && !isEditing && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {isEditing ? (
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
                <FormControl fullWidth>
                  <InputLabel>Business Domain</InputLabel>
                  <Select
                    value={formData.business_domain}
                    label="Business Domain"
                    onChange={(e) => setFormData({ ...formData, business_domain: e.target.value as BusinessDomain })}
                  >
                    {Object.values(BusinessDomain).map((domain) => (
                      <MenuItem key={domain} value={domain}>
                        {domain.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={handleChange('description')}
                  required
                  multiline
                  rows={3}
                  error={!formData.description.trim() && !!error}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Business Criticality</InputLabel>
                  <Select
                    value={formData.business_criticality}
                    label="Business Criticality"
                    onChange={(e) => setFormData({ ...formData, business_criticality: e.target.value as BusinessCriticality })}
                  >
                    {Object.values(BusinessCriticality).map((criticality) => (
                      <MenuItem key={criticality} value={criticality}>
                        {criticality}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Business Capability"
                  value={formData.business_capability}
                  onChange={handleChange('business_capability')}
                  placeholder="e.g., Customer Relationship"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Business Owner"
                  value={formData.business_owner}
                  onChange={handleChange('business_owner')}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Business Owner Email"
                  type="email"
                  value={formData.business_owner_email}
                  onChange={handleChange('business_owner_email')}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Strategic Value"
                  value={formData.strategic_value}
                  onChange={handleChange('strategic_value')}
                  multiline
                  rows={2}
                  placeholder="Describe the strategic value and importance of this business application"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button variant="outlined" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSubmit}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : isNew ? 'Create' : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Business Domain</Typography>
                <Chip 
                  label={formData.business_domain.replace(/_/g, ' ')} 
                  color="primary" 
                  sx={{ mt: 0.5 }} 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Business Criticality</Typography>
                <Chip 
                  label={formData.business_criticality} 
                  color={CRITICALITY_COLORS[formData.business_criticality]} 
                  sx={{ mt: 0.5 }} 
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography>{formData.description}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Business Capability</Typography>
                <Typography>{formData.business_capability || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Business Owner</Typography>
                <Typography>{formData.business_owner || '-'}</Typography>
                {formData.business_owner_email && (
                  <Typography variant="body2" color="text.secondary">
                    <a href={`mailto:${formData.business_owner_email}`}>{formData.business_owner_email}</a>
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Strategic Value</Typography>
                <Typography>{formData.strategic_value || '-'}</Typography>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Linked IT Applications */}
      {!isNew && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Linked IT Applications
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              IT applications that support this business application
            </Typography>
            
            {linkedApps.length === 0 ? (
              <Typography color="text.secondary">No linked applications</Typography>
            ) : (
              <List>
                {linkedApps.map((app) => (
                  <ListItem 
                    key={app.id} 
                    divider
                    component="div"
                    onClick={() => navigate(`/applications/${app.id}`)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <ListItemIcon>
                      <AppsIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography 
                          component="span" 
                          color="primary" 
                          sx={{ fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}
                        >
                          {app.name}
                        </Typography>
                      }
                      secondary={`${app.type} - ${app.lifecycle_status}`}
                    />
                    <Chip 
                      label={app.business_criticality} 
                      size="small" 
                      color={CRITICALITY_COLORS[app.business_criticality]} 
                      variant="outlined"
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
