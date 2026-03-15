import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Chip,
  Paper,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as FitIcon,
} from '@mui/icons-material';
import CytoscapeComponent from 'react-cytoscapejs';
import { dashboardApi } from '../services/api';
import { ArchitectureGraph, ApplicationType, BusinessCriticality } from '../types';

const TYPE_COLORS: Record<ApplicationType, string> = {
  CRM: '#2563eb',
  ERP: '#7c3aed',
  API: '#10b981',
  BACKEND: '#f59e0b',
  SAAS: '#ec4899',
  MICROSERVICE: '#06b6d4',
  DATABASE: '#8b5cf6',
  MIDDLEWARE: '#f97316',
  FRONTEND: '#14b8a6',
  MOBILE: '#6366f1',
  OTHER: '#6b7280',
};

const CRITICALITY_SIZES: Record<BusinessCriticality, number> = {
  CRITICAL: 60,
  HIGH: 50,
  MEDIUM: 40,
  LOW: 30,
};

const cytoscapeStylesheet = [
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
    selector: 'node:selected',
    style: {
      'border-width': 4,
      'border-color': '#2563eb',
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
      'arrow-scale': 1,
    },
  },
  {
    selector: 'edge[type = "dependency"]',
    style: {
      'line-color': '#f59e0b',
      'target-arrow-color': '#f59e0b',
      'line-style': 'dashed',
    },
  },
  {
    selector: 'edge[type = "interface"]',
    style: {
      'line-color': '#10b981',
      'target-arrow-color': '#10b981',
    },
  },
  {
    selector: 'edge:selected',
    style: {
      'width': 4,
      'line-color': '#2563eb',
      'target-arrow-color': '#2563eb',
    },
  },
];

const layoutOptions = {
  name: 'cose',
  idealEdgeLength: 150,
  nodeOverlap: 20,
  refresh: 20,
  fit: true,
  padding: 30,
  randomize: false,
  componentSpacing: 100,
  nodeRepulsion: 400000,
  edgeElasticity: 100,
  nestingFactor: 5,
  gravity: 80,
  numIter: 1000,
  initialTemp: 200,
  coolingFactor: 0.95,
  minTemp: 1.0,
};

export default function ArchitectureMap() {
  const [graphData, setGraphData] = useState<ArchitectureGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [edgeFilter, setEdgeFilter] = useState<string>('all');
  const cyRef = useRef<any>(null);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const response = await dashboardApi.getGraph();
      setGraphData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getElements = useCallback(() => {
    if (!graphData) return [];

    const nodes = graphData.nodes.map((node) => ({
      data: {
        id: node.id,
        label: node.label,
        color: TYPE_COLORS[node.type] || '#6b7280',
        size: CRITICALITY_SIZES[node.criticality] || 40,
        type: node.type,
        status: node.status,
        criticality: node.criticality,
      },
    }));

    let edges = graphData.edges;
    if (edgeFilter !== 'all') {
      edges = edges.filter((edge) => edge.type === edgeFilter);
    }

    const edgeElements = edges.map((edge) => ({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: edge.type,
      },
    }));

    return [...nodes, ...edgeElements];
  }, [graphData, edgeFilter]);

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

    cy.on('tap', 'node', (event: any) => {
      const node = event.target;
      setSelectedNode({
        id: node.data('id'),
        label: node.data('label'),
        type: node.data('type'),
        status: node.data('status'),
        criticality: node.data('criticality'),
      });
    });

    cy.on('tap', (event: any) => {
      if (event.target === cy) {
        setSelectedNode(null);
      }
    });
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Architecture Map
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Interactive visualization of system architecture
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Graph */}
        <Card sx={{ flex: 1 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Edge Filter</InputLabel>
              <Select
                value={edgeFilter}
                label="Edge Filter"
                onChange={(e) => setEdgeFilter(e.target.value)}
              >
                <MenuItem value="all">All Connections</MenuItem>
                <MenuItem value="dependency">Dependencies Only</MenuItem>
                <MenuItem value="interface">Interfaces Only</MenuItem>
              </Select>
            </FormControl>

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

          <Box sx={{ height: 600, backgroundColor: '#f8fafc' }}>
            <CytoscapeComponent
              elements={getElements()}
              stylesheet={cytoscapeStylesheet}
              layout={layoutOptions}
              cy={handleCyReady}
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
        </Card>

        {/* Legend & Details */}
        <Box sx={{ width: 280 }}>
          {/* Legend */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Legend
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Application Types
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {Object.entries(TYPE_COLORS).slice(0, 6).map(([type, color]) => (
                  <Chip
                    key={type}
                    label={type}
                    size="small"
                    sx={{ backgroundColor: color, color: 'white', fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Size = Criticality
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Larger nodes represent more critical systems
              </Typography>
            </CardContent>
          </Card>

          {/* Selected Node Details */}
          {selectedNode && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Selected Node
                </Typography>
                <Typography variant="subtitle1" fontWeight={600}>
                  {selectedNode.label}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Type</Typography>
                    <Chip
                      label={selectedNode.type}
                      size="small"
                      sx={{
                        ml: 1,
                        backgroundColor: TYPE_COLORS[selectedNode.type as ApplicationType],
                        color: 'white',
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Chip label={selectedNode.status} size="small" sx={{ ml: 1 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Criticality</Typography>
                    <Chip label={selectedNode.criticality} size="small" sx={{ ml: 1 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
}
