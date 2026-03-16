import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Tabs,
  Tab,
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
  Code as TechIcon,
  SwapHoriz as InterfaceIcon,
  People as PeopleIcon,
  AccountTree as DependencyIcon,
  Link as LinkIcon,
  Save as SaveIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { applicationsApi, interfacesApi, dependenciesApi, customAttributesApi } from '../services/api';
import { Application, Technology, SystemInterface, Person, Dependency, BusinessCriticality, LifecycleStatus, ApplicationType } from '../types';
import CustomAttributesDisplay, { useCustomAttributes } from '../components/CustomAttributesDisplay';

const CRITICALITY_COLORS: Record<BusinessCriticality, 'error' | 'warning' | 'primary' | 'success'> = {
  CRITICAL: 'error',
  HIGH: 'warning',
  MEDIUM: 'primary',
  LOW: 'success',
};

const STATUS_COLORS: Record<LifecycleStatus, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  PLANNING: 'default',
  DEVELOPMENT: 'info',
  ACTIVE: 'success',
  MAINTENANCE: 'warning',
  DEPRECATED: 'error',
  RETIRED: 'default',
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [application, setApplication] = useState<Application | null>(null);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [interfaces, setInterfaces] = useState<SystemInterface[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'BACKEND' as ApplicationType,
    lifecycle_status: 'DEVELOPMENT' as LifecycleStatus,
    business_criticality: 'MEDIUM' as BusinessCriticality,
    department: '',
    documentation_url: '',
    repository_url: '',
  });

  const isNew = id === 'new';
  
  // Custom attributes
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  
  useEffect(() => {
    // Load custom attribute values when viewing/editing existing application
    if (id && !isNew) {
      customAttributesApi.getValues('APPLICATION', parseInt(id))
        .then(res => setCustomValues(res.data.data || {}))
        .catch(console.error);
    }
  }, [id, isNew]);

  useEffect(() => {
    if (id && !isNew) {
      fetchData(id);
    } else if (isNew) {
      setLoading(false);
    }
  }, [id, isNew]);

  const fetchData = async (appId: string) => {
    setLoading(true);
    try {
      const [appRes, techRes, ifaceRes, personsRes, depsRes] = await Promise.all([
        applicationsApi.getById(appId),
        applicationsApi.getTechnologies(appId),
        interfacesApi.getByApplication(appId),
        applicationsApi.getPersons(appId),
        dependenciesApi.getByApplication(appId),
      ]);

      const app = appRes.data.data;
      setApplication(app);
      setTechnologies(techRes.data.data);
      setInterfaces(ifaceRes.data.data);
      setPersons(personsRes.data.data);
      setDependencies(depsRes.data.data);
      
      // Load application data into form for editing
      setFormData({
        name: app.name || '',
        description: app.description || '',
        type: app.type || 'BACKEND',
        lifecycle_status: app.lifecycle_status || 'DEVELOPMENT',
        business_criticality: app.business_criticality || 'MEDIUM',
        department: app.department || '',
        documentation_url: app.documentation_url || '',
        repository_url: app.repository_url || '',
      });
    } catch (error) {
      console.error('Failed to fetch application data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isNew || isEditing) {
    const handleFormChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
      setFormData({ ...formData, [field]: e.target.value });
    };

    const handleSubmit = async () => {
      if (!formData.name.trim()) {
        setError('Application name is required');
        return;
      }
      
      setSaving(true);
      setError(null);
      try {
        let appId: number;
        if (isNew) {
          const response = await applicationsApi.create(formData);
          appId = response.data.data.id;
          // Save custom attributes for new application
          if (Object.keys(customValues).length > 0) {
            await customAttributesApi.setValues('APPLICATION', appId, customValues);
          }
          navigate(`/applications/${appId}`);
        } else {
          await applicationsApi.update(id!, formData);
          appId = parseInt(id!);
          // Save custom attributes
          if (Object.keys(customValues).length > 0) {
            await customAttributesApi.setValues('APPLICATION', appId, customValues);
          }
          setIsEditing(false);
          fetchData(id!);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || `Failed to ${isNew ? 'create' : 'update'} application`);
      } finally {
        setSaving(false);
      }
    };

    const handleCancel = () => {
      // Always go back to applications list when canceling
      navigate('/applications');
    };

    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/applications')}
          sx={{ mb: 2 }}
          size="small"
        >
          Back to Applications
        </Button>
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
              {isNew ? 'Create New Application' : `Edit: ${application?.name}`}
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
                  label="Application Name"
                  value={formData.name}
                  onChange={handleFormChange('name')}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    label="Type"
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ApplicationType })}
                  >
                    {Object.values(ApplicationType).map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={handleFormChange('description')}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Lifecycle Status</InputLabel>
                  <Select
                    value={formData.lifecycle_status}
                    label="Lifecycle Status"
                    onChange={(e) => setFormData({ ...formData, lifecycle_status: e.target.value as LifecycleStatus })}
                  >
                    {Object.values(LifecycleStatus).map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Business Criticality</InputLabel>
                  <Select
                    value={formData.business_criticality}
                    label="Business Criticality"
                    onChange={(e) => setFormData({ ...formData, business_criticality: e.target.value as BusinessCriticality })}
                  >
                    {Object.values(BusinessCriticality).map((crit) => (
                      <MenuItem key={crit} value={crit}>{crit}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Department"
                  value={formData.department}
                  onChange={handleFormChange('department')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Documentation URL"
                  value={formData.documentation_url}
                  onChange={handleFormChange('documentation_url')}
                  type="url"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Repository URL"
                  value={formData.repository_url}
                  onChange={handleFormChange('repository_url')}
                  type="url"
                />
              </Grid>
              
              {/* Custom Attributes */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <CustomAttributesDisplay
                  entityType="APPLICATION"
                  entityId={isNew ? 0 : parseInt(id!)}
                  isEditing={true}
                  values={customValues}
                  onChange={setCustomValues}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSubmit}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : isNew ? 'Create Application' : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!application) {
    return <Typography color="error">Application not found</Typography>;
  }

  return (
    <Box>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/applications')}
        sx={{ mb: 2 }}
        size="small"
      >
        Back to Applications
      </Button>

      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                {application.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {application.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={application.type} variant="outlined" />
                <Chip 
                  label={application.lifecycle_status} 
                  color={STATUS_COLORS[application.lifecycle_status]} 
                />
                <Chip 
                  label={application.business_criticality} 
                  color={CRITICALITY_COLORS[application.business_criticality]} 
                />
                {application.department && (
                  <Chip label={application.department} variant="outlined" />
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Application
                </Button>
                {application.documentation_url && (
                  <Button
                    startIcon={<LinkIcon />}
                    href={application.documentation_url}
                    target="_blank"
                    variant="outlined"
                    size="small"
                  >
                    Documentation
                  </Button>
                )}
                {application.repository_url && (
                  <Button
                    startIcon={<LinkIcon />}
                    href={application.repository_url}
                    target="_blank"
                    variant="outlined"
                    size="small"
                  >
                    Repository
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/impact-analysis?appId=${application.id}`)}
                >
                  Analyze Impact
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<TechIcon />} iconPosition="start" label="Technologies" />
          <Tab icon={<InterfaceIcon />} iconPosition="start" label="Interfaces" />
          <Tab icon={<DependencyIcon />} iconPosition="start" label="Dependencies" />
          <Tab icon={<PeopleIcon />} iconPosition="start" label="Responsible" />
        </Tabs>

        <CardContent>
          {/* Technologies Tab */}
          <TabPanel value={tabValue} index={0}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Technology</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Usage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {technologies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No technologies assigned</TableCell>
                    </TableRow>
                  ) : (
                    technologies.map((tech: any) => (
                      <TableRow key={tech.id}>
                        <TableCell>{tech.name}</TableCell>
                        <TableCell>{tech.version || '-'}</TableCell>
                        <TableCell>{tech.category}</TableCell>
                        <TableCell>
                          <Chip 
                            label={tech.status} 
                            size="small"
                            color={tech.status === 'OBSOLETE' ? 'error' : tech.status === 'DEPRECATED' ? 'warning' : 'success'}
                          />
                        </TableCell>
                        <TableCell>{tech.usage_type || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Interfaces Tab */}
          <TabPanel value={tabValue} index={1}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Interface</TableCell>
                    <TableCell>Direction</TableCell>
                    <TableCell>Connected Application</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Criticality</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {interfaces.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No interfaces defined</TableCell>
                    </TableRow>
                  ) : (
                    interfaces.map((iface) => (
                      <TableRow key={iface.id}>
                        <TableCell>{iface.name}</TableCell>
                        <TableCell>
                          {iface.source_application_id === application.id ? 'Outbound' : 'Inbound'}
                        </TableCell>
                        <TableCell>
                          {iface.source_application_id === application.id 
                            ? iface.target_application_name 
                            : iface.source_application_name}
                        </TableCell>
                        <TableCell>
                          <Chip label={iface.integration_type} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={iface.criticality} 
                            size="small" 
                            color={CRITICALITY_COLORS[iface.criticality]}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Dependencies Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Depends On
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Application</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Critical</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dependencies
                        .filter(d => d.source_application_id === application.id)
                        .map((dep) => (
                          <TableRow key={dep.id}>
                            <TableCell>{dep.target_application_name}</TableCell>
                            <TableCell>{dep.dependency_type}</TableCell>
                            <TableCell>
                              {dep.is_critical && <Chip label="Critical" size="small" color="error" />}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Depended By
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Application</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Critical</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dependencies
                        .filter(d => d.target_application_id === application.id)
                        .map((dep) => (
                          <TableRow key={dep.id}>
                            <TableCell>{dep.source_application_name}</TableCell>
                            <TableCell>{dep.dependency_type}</TableCell>
                            <TableCell>
                              {dep.is_critical && <Chip label="Critical" size="small" color="error" />}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Responsible Tab */}
          <TabPanel value={tabValue} index={3}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Team</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {persons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No responsible assigned</TableCell>
                    </TableRow>
                  ) : (
                    persons.map((person: any) => (
                      <TableRow key={person.id}>
                        <TableCell>{person.name}</TableCell>
                        <TableCell>
                          <Chip label={person.assignment_role || person.role} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{person.email}</TableCell>
                        <TableCell>{person.team || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Custom Attributes */}
      <CustomAttributesDisplay
        entityType="APPLICATION"
        entityId={parseInt(id!)}
      />
    </Box>
  );
}
