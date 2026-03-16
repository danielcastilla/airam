import { useState, useEffect, useCallback } from 'react';
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
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Link,
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import {
  customAttributesApi,
  EntityType,
  CustomAttributeSection,
  CustomAttributeDefinition,
} from '../services/api';

interface CustomAttributesDisplayProps {
  entityType: EntityType;
  entityId: number;
  isEditing?: boolean;
  values?: Record<string, any>;
  onChange?: (values: Record<string, any>) => void;
}

// Render field value in view mode
function renderValue(attr: CustomAttributeDefinition, value: any): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <Typography color="text.secondary" variant="body2">-</Typography>;
  }

  switch (attr.field_type) {
    case 'BOOLEAN':
      return <Chip size="small" label={value ? 'Yes' : 'No'} color={value ? 'success' : 'default'} />;
    case 'URL':
      return (
        <Link href={value} target="_blank" rel="noopener noreferrer">
          {value}
        </Link>
      );
    case 'EMAIL':
      return (
        <Link href={`mailto:${value}`}>
          {value}
        </Link>
      );
    case 'DATE':
      return <Typography variant="body2">{new Date(value).toLocaleDateString()}</Typography>;
    case 'SELECT':
      if (attr.options) {
        const option = attr.options.find(o => o.value === value);
        return <Chip size="small" label={option?.label || value} variant="outlined" />;
      }
      return <Typography variant="body2">{value}</Typography>;
    case 'TEXTAREA':
      return <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{value}</Typography>;
    default:
      return <Typography variant="body2">{value}</Typography>;
  }
}

// Render field input in edit mode
function renderInput(
  attr: CustomAttributeDefinition,
  value: any,
  onChange: (newValue: any) => void
): React.ReactNode {
  switch (attr.field_type) {
    case 'BOOLEAN':
      return (
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
            />
          }
          label={attr.label}
        />
      );
    case 'SELECT':
      return (
        <FormControl fullWidth>
          <InputLabel>{attr.label}</InputLabel>
          <Select
            value={value || ''}
            label={attr.label}
            onChange={(e) => onChange(e.target.value)}
          >
            <MenuItem value="">
              <em>Select...</em>
            </MenuItem>
            {attr.options?.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    case 'TEXTAREA':
      return (
        <TextField
          fullWidth
          label={attr.label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          multiline
          rows={3}
          placeholder={attr.placeholder}
          helperText={attr.help_text}
          required={attr.is_required}
        />
      );
    case 'NUMBER':
      return (
        <TextField
          fullWidth
          label={attr.label}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
          placeholder={attr.placeholder}
          helperText={attr.help_text}
          required={attr.is_required}
        />
      );
    case 'DATE':
      return (
        <TextField
          fullWidth
          label={attr.label}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          helperText={attr.help_text}
          required={attr.is_required}
        />
      );
    case 'URL':
      return (
        <TextField
          fullWidth
          label={attr.label}
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={attr.placeholder || 'https://...'}
          helperText={attr.help_text}
          required={attr.is_required}
        />
      );
    case 'EMAIL':
      return (
        <TextField
          fullWidth
          label={attr.label}
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={attr.placeholder || 'email@example.com'}
          helperText={attr.help_text}
          required={attr.is_required}
        />
      );
    default: // STRING
      return (
        <TextField
          fullWidth
          label={attr.label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={attr.placeholder}
          helperText={attr.help_text}
          required={attr.is_required}
        />
      );
  }
}

export default function CustomAttributesDisplay({
  entityType,
  entityId,
  isEditing = false,
  values: externalValues,
  onChange,
}: CustomAttributesDisplayProps) {
  const [sections, setSections] = useState<CustomAttributeSection[]>([]);
  const [attributes, setAttributes] = useState<CustomAttributeDefinition[]>([]);
  const [internalValues, setInternalValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Use external values if provided, otherwise use internal state
  const values = externalValues !== undefined ? externalValues : internalValues;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [templateRes, valuesRes] = await Promise.all([
        customAttributesApi.getTemplate(entityType),
        entityId > 0 ? customAttributesApi.getValues(entityType, entityId) : Promise.resolve({ data: { data: {} } }),
      ]);

      setSections(templateRes.data.data.sections || []);
      setAttributes(templateRes.data.data.attributes.filter((a: CustomAttributeDefinition) => a.is_active) || []);
      
      if (externalValues === undefined) {
        setInternalValues(valuesRes.data.data || {});
      }
    } catch (error) {
      console.error('Error loading custom attributes:', error);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, externalValues]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleValueChange = (attrName: string, newValue: any) => {
    const newValues = { ...values, [attrName]: newValue };
    if (onChange) {
      onChange(newValues);
    } else {
      setInternalValues(newValues);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // Don't render anything if there are no active attributes
  if (attributes.length === 0) {
    return null;
  }

  // Group attributes by section
  const attributesBySection: Record<string | number, CustomAttributeDefinition[]> = {};
  attributes.forEach((attr) => {
    const key = attr.section_id || 'general';
    if (!attributesBySection[key]) {
      attributesBySection[key] = [];
    }
    attributesBySection[key].push(attr);
  });

  const generalAttrs = attributesBySection['general'] || [];

  // Render a group of attributes
  const renderAttributeGroup = (attrs: CustomAttributeDefinition[]) => (
    <Grid container spacing={2}>
      {attrs.map((attr) => (
        <Grid item xs={12} md={attr.field_type === 'TEXTAREA' ? 12 : 6} key={attr.id}>
          {isEditing ? (
            renderInput(attr, values[attr.name], (newVal) => handleValueChange(attr.name, newVal))
          ) : (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {attr.label}
                {attr.is_required && <span style={{ color: 'red' }}> *</span>}
              </Typography>
              {renderValue(attr, values[attr.name])}
            </Box>
          )}
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box sx={{ mt: 3 }}>
      {/* General attributes (no section) */}
      {generalAttrs.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Additional Information
            </Typography>
            {renderAttributeGroup(generalAttrs)}
          </CardContent>
        </Card>
      )}

      {/* Sectioned attributes */}
      {sections.map((section) => {
        const sectionAttrs = attributesBySection[section.id] || [];
        if (sectionAttrs.length === 0) return null;

        return (
          <Accordion key={section.id} defaultExpanded={!section.is_collapsed}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box>
                <Typography fontWeight={600}>{section.name}</Typography>
                {section.description && (
                  <Typography variant="body2" color="text.secondary">
                    {section.description}
                  </Typography>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {renderAttributeGroup(sectionAttrs)}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}

// Hook to manage custom attribute values in forms
export function useCustomAttributes(entityType: EntityType, entityId: number) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (entityId > 0) {
      customAttributesApi.getValues(entityType, entityId)
        .then(res => setValues(res.data.data || {}))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [entityType, entityId]);

  const saveValues = async (newEntityId?: number) => {
    const id = newEntityId || entityId;
    if (id > 0 && Object.keys(values).length > 0) {
      await customAttributesApi.setValues(entityType, id, values);
    }
  };

  return { values, setValues, loading, saveValues };
}
