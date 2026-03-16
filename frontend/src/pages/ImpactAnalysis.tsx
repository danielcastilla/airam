import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Autocomplete,
  TextField,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Button,
} from '@mui/material';
import {
  Warning as WarningIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as FitIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import CytoscapeComponent from 'react-cytoscapejs';
import { applicationsApi, impactApi } from '../services/api';
import { Application, ImpactAnalysis as ImpactAnalysisType, BusinessCriticality } from '../types';

const DEPTH_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#6b7280'];

const CRITICALITY_COLORS: Record<BusinessCriticality, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#f59e0b',
  MEDIUM: '#3b82f6',
  LOW: '#6b7280',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cytoscapeStylesheet: any[] = [
  {
    selector: 'node',
    style: {
      'background-color': 'data(color)',
      'label': 'data(label)',
      'width': 'data(size)',
      'height': 'data(size)',
      'font-size': '10px',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': 5,
      'border-width': 2,
      'border-color': '#fff',
    },
  },
  {
    selector: 'node[isRoot]',
    style: {
      'border-width': 4,
      'border-color': '#2563eb',
      'background-color': '#2563eb',
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': 4,
      'border-color': '#f59e0b',
    },
  },
  {
    selector: 'edge',
    style: {
      'width': 2,
      'line-color': '#94a3b8',
      'target-arrow-color': '#94a3b8',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
    },
  },
];

const layoutOptions = {
  name: 'breadthfirst',
  directed: true,
  padding: 50,
  spacingFactor: 1.5,
  avoidOverlap: true,
};

export default function ImpactAnalysis() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [impactData, setImpactData] = useState<ImpactAnalysisType | null>(null);
  const [loading, setLoading] = useState(false);
  const [appsLoading, setAppsLoading] = useState(true);
  const cyRef = useRef<any>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setAppsLoading(true);
    try {
      const response = await applicationsApi.getAll({ limit: 1000 });
      setApplications(response.data.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setAppsLoading(false);
    }
  };

  const fetchImpactAnalysis = async (appId: string) => {
    setLoading(true);
    try {
      const response = await impactApi.analyze(appId);
      setImpactData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch impact analysis:', error);
      setImpactData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAppChange = (_: any, app: Application | null) => {
    setSelectedApp(app);
    setImpactData(null);
    if (app) {
      fetchImpactAnalysis(String(app.id));
    }
  };

  const getElements = useCallback(() => {
    if (!impactData) return [];

    const nodesMap = new Map<string, any>();
    const edges: any[] = [];

    // Root node
    nodesMap.set(String(impactData.application.id), {
      data: {
        id: String(impactData.application.id),
        label: impactData.application.name,
        color: '#2563eb',
        size: 60,
        isRoot: true,
        depth: 0,
      },
    });

    // Direct dependencies
    impactData.directDependencies.forEach((dep) => {
      if (!nodesMap.has(String(dep.id))) {
        nodesMap.set(String(dep.id), {
          data: {
            id: String(dep.id),
            label: dep.name,
            color: DEPTH_COLORS[1],
            size: 45,
            depth: 1,
            criticality: dep.business_criticality,
          },
        });
      }
      edges.push({
        data: {
          id: `edge-${impactData.application.id}-${dep.id}`,
          source: String(impactData.application.id),
          target: String(dep.id),
        },
      });
    });

    // Indirect dependencies
    impactData.indirectDependencies.forEach((dep) => {
      if (!nodesMap.has(String(dep.id))) {
        nodesMap.set(String(dep.id), {
          data: {
            id: String(dep.id),
            label: dep.name,
            color: DEPTH_COLORS[2],
            size: 35,
            depth: 2,
            criticality: dep.business_criticality,
          },
        });
      }
    });

    // Interfaces as edges where possible
    impactData.affectedInterfaces.forEach((iface, index) => {
      if (nodesMap.has(String(iface.source_application_id)) && nodesMap.has(String(iface.target_application_id))) {
        edges.push({
          data: {
            id: `iface-${index}`,
            source: String(iface.source_application_id),
            target: String(iface.target_application_id),
            label: iface.name,
          },
        });
      }
    });

    return [...nodesMap.values(), ...edges];
  }, [impactData]);

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit();
    }
  };

  const handleCyReady = (cy: any) => {
    cyRef.current = cy;
  };

  const getRiskLevel = () => {
    if (!impactData) return null;
    const total = impactData.directDependencies.length + impactData.indirectDependencies.length + impactData.affectedInterfaces.length;
    if (total >= 10) return { level: 'HIGH', color: 'error' };
    if (total >= 5) return { level: 'MEDIUM', color: 'warning' };
    return { level: 'LOW', color: 'success' };
  };

  const getTotalImpactedSystems = () => {
    if (!impactData) return 0;
    return impactData.directDependencies.length + impactData.indirectDependencies.length + impactData.affectedInterfaces.length;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            Impact Analysis
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Analyze the impact of changes to an application
          </Typography>
        </Box>
      </Box>

      {/* Application Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <Autocomplete
              options={applications}
              getOptionLabel={(option) => option.name}
              value={selectedApp}
              onChange={handleAppChange}
              loading={appsLoading}
              sx={{ minWidth: { xs: '100%', sm: 350 }, flex: { xs: 1, sm: 'none' } }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Application"
                  placeholder="Search applications..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {appsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{option.name}</span>
                    <Chip
                      size="small"
                      label={option.business_criticality}
                      sx={{
                        backgroundColor: CRITICALITY_COLORS[option.business_criticality],
                        color: 'white',
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>
                </li>
              )}
            />
            {selectedApp && (
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => fetchImpactAnalysis(String(selectedApp.id))}
                disabled={loading}
                sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
              >
                Refresh
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!selectedApp && !loading && (
        <Alert severity="info">
          Select an application to analyze its dependencies and potential impact
        </Alert>
      )}

      {impactData && !loading && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
          {/* Impact Graph */}
          <Card sx={{ flex: 1, order: { xs: 2, lg: 1 } }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6">Dependency Graph</Typography>
              <Box sx={{ flex: 1 }} />
              <ToggleButtonGroup size="small">
                <ToggleButton value="zoomIn" onClick={handleZoomIn}>
                  <ZoomInIcon />
                </ToggleButton>
                <ToggleButton value="zoomOut" onClick={handleZoomOut}>
                  <ZoomOutIcon />
                </ToggleButton>
                <ToggleButton value="fit" onClick={handleFit}>
                  <FitIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ height: { xs: 300, sm: 400, md: 500 }, backgroundColor: '#f8fafc' }}>
              <CytoscapeComponent
                elements={getElements()}
                stylesheet={cytoscapeStylesheet}
                layout={layoutOptions}
                cy={handleCyReady}
                style={{ width: '100%', height: '100%' }}
              />
            </Box>
          </Card>

          {/* Impact Summary */}
          <Box sx={{ width: { xs: '100%', lg: 320 }, order: { xs: 1, lg: 2 } }}>
            {/* Risk Alert */}
            {getRiskLevel() && (
              <Alert
                severity={getRiskLevel()!.color as any}
                icon={<WarningIcon />}
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle2">
                  Impact Risk: {getRiskLevel()!.level}
                </Typography>
                <Typography variant="body2">
                  {getTotalImpactedSystems()} systems would be affected
                </Typography>
              </Alert>
            )}

            {/* Summary Card */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Impact Summary
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="h4" color="primary.main">
                      {impactData.directDependencies.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Direct Dependencies
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h4" color="warning.main">
                      {impactData.indirectDependencies.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Indirect Dependencies
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h4" color="info.main">
                      {impactData.affectedInterfaces.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Affected Interfaces
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h4" color="error.main">
                      {getTotalImpactedSystems()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Impacted
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Direct Dependencies List */}
            <Card>
              <CardContent sx={{ pb: 0 }}>
                <Typography variant="h6" gutterBottom>
                  Direct Dependencies
                </Typography>
              </CardContent>
              <List dense>
                {impactData.directDependencies.map((dep, index) => (
                  <div key={dep.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <ArrowIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={dep.name}
                        secondary={
                          <Chip
                            size="small"
                            label={dep.business_criticality}
                            sx={{
                              mt: 0.5,
                              backgroundColor: CRITICALITY_COLORS[dep.business_criticality],
                              color: 'white',
                              fontSize: '0.65rem',
                              height: 20,
                            }}
                          />
                        }
                      />
                    </ListItem>
                  </div>
                ))}
                {impactData.directDependencies.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No direct dependencies"
                      sx={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            </Card>
          </Box>
        </Box>
      )}
    </Box>
  );
}
