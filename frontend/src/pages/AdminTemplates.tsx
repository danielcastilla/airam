import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  DragIndicator as DragIcon,
  Folder as FolderIcon,
  TextFields as TextIcon,
  Numbers as NumberIcon,
  ToggleOn as BooleanIcon,
  CalendarMonth as DateIcon,
  List as SelectIcon,
  Notes as TextAreaIcon,
  Link as UrlIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import {
  customAttributesApi,
  EntityType,
  FieldType,
  CustomAttributeSection,
  CustomAttributeDefinition,
} from '../services/api';

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'BUSINESS_APPLICATION', label: 'Business Applications' },
  { value: 'APPLICATION', label: 'Applications' },
  { value: 'TECHNOLOGY', label: 'Technologies' },
  { value: 'INTERFACE', label: 'Interfaces' },
  { value: 'DEPENDENCY', label: 'Dependencies' },
];

const FIELD_TYPES: { value: FieldType; label: string; icon: JSX.Element }[] = [
  { value: 'STRING', label: 'Text', icon: <TextIcon /> },
  { value: 'NUMBER', label: 'Number', icon: <NumberIcon /> },
  { value: 'BOOLEAN', label: 'Yes/No', icon: <BooleanIcon /> },
  { value: 'DATE', label: 'Date', icon: <DateIcon /> },
  { value: 'SELECT', label: 'Dropdown', icon: <SelectIcon /> },
  { value: 'TEXTAREA', label: 'Long Text', icon: <TextAreaIcon /> },
  { value: 'URL', label: 'URL', icon: <UrlIcon /> },
  { value: 'EMAIL', label: 'Email', icon: <EmailIcon /> },
];

const getFieldIcon = (fieldType: FieldType) => {
  const field = FIELD_TYPES.find(f => f.value === fieldType);
  return field?.icon || <TextIcon />;
};

export default function AdminTemplates() {
  const [activeTab, setActiveTab] = useState(0);
  const [sections, setSections] = useState<CustomAttributeSection[]>([]);
  const [attributes, setAttributes] = useState<CustomAttributeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Section dialog
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CustomAttributeSection | null>(null);
  const [sectionForm, setSectionForm] = useState({ name: '', description: '' });

  // Attribute dialog
  const [attrDialogOpen, setAttrDialogOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<CustomAttributeDefinition | null>(null);
  const [attrForm, setAttrForm] = useState<{
    name: string;
    label: string;
    field_type: FieldType;
    section_id: number | null;
    is_required: boolean;
    default_value: string;
    placeholder: string;
    help_text: string;
    options: string;
  }>({
    name: '',
    label: '',
    field_type: 'STRING',
    section_id: null,
    is_required: false,
    default_value: '',
    placeholder: '',
    help_text: '',
    options: '',
  });

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'section' | 'attribute';
    id: number;
    name: string;
  }>({ open: false, type: 'section', id: 0, name: '' });

  const currentEntityType = ENTITY_TYPES[activeTab].value;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sectionsRes, attrsRes] = await Promise.all([
        customAttributesApi.getSections(currentEntityType),
        customAttributesApi.getDefinitions(currentEntityType, true),
      ]);
      setSections(sectionsRes.data.data || []);
      setAttributes(attrsRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [currentEntityType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Section handlers
  const handleOpenSectionDialog = (section?: CustomAttributeSection) => {
    if (section) {
      setEditingSection(section);
      setSectionForm({ name: section.name, description: section.description || '' });
    } else {
      setEditingSection(null);
      setSectionForm({ name: '', description: '' });
    }
    setSectionDialogOpen(true);
  };

  const handleSaveSection = async () => {
    try {
      if (editingSection) {
        await customAttributesApi.updateSection(editingSection.id, sectionForm);
      } else {
        await customAttributesApi.createSection({
          entity_type: currentEntityType,
          ...sectionForm,
        });
      }
      setSectionDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error saving section');
    }
  };

  // Attribute handlers
  const handleOpenAttrDialog = (attr?: CustomAttributeDefinition) => {
    if (attr) {
      setEditingAttr(attr);
      setAttrForm({
        name: attr.name,
        label: attr.label,
        field_type: attr.field_type,
        section_id: attr.section_id || null,
        is_required: attr.is_required,
        default_value: attr.default_value || '',
        placeholder: attr.placeholder || '',
        help_text: attr.help_text || '',
        options: attr.options ? attr.options.map(o => `${o.value}:${o.label}`).join('\n') : '',
      });
    } else {
      setEditingAttr(null);
      setAttrForm({
        name: '',
        label: '',
        field_type: 'STRING',
        section_id: null,
        is_required: false,
        default_value: '',
        placeholder: '',
        help_text: '',
        options: '',
      });
    }
    setAttrDialogOpen(true);
  };

  const handleSaveAttr = async () => {
    try {
      const options = attrForm.field_type === 'SELECT' && attrForm.options
        ? attrForm.options.split('\n').filter(l => l.trim()).map(line => {
            const [value, label] = line.split(':').map(s => s.trim());
            return { value: value || label, label: label || value };
          })
        : undefined;

      const data = {
        name: attrForm.name,
        label: attrForm.label,
        field_type: attrForm.field_type,
        section_id: attrForm.section_id,
        is_required: attrForm.is_required,
        default_value: attrForm.default_value || undefined,
        placeholder: attrForm.placeholder || undefined,
        help_text: attrForm.help_text || undefined,
        options,
      };

      if (editingAttr) {
        await customAttributesApi.updateDefinition(editingAttr.id, data);
      } else {
        await customAttributesApi.createDefinition({
          entity_type: currentEntityType,
          ...data,
        });
      }
      setAttrDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error saving attribute');
    }
  };

  const handleToggleActive = async (attr: CustomAttributeDefinition) => {
    try {
      await customAttributesApi.updateDefinition(attr.id, { is_active: !attr.is_active });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating attribute');
    }
  };

  // Delete handlers
  const handleDelete = async () => {
    try {
      if (deleteDialog.type === 'section') {
        await customAttributesApi.deleteSection(deleteDialog.id);
      } else {
        await customAttributesApi.deleteDefinition(deleteDialog.id);
      }
      setDeleteDialog({ ...deleteDialog, open: false });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting');
    }
  };

  // Group attributes by section
  const attributesBySection = attributes.reduce((acc, attr) => {
    const key = attr.section_id || 'unsectioned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(attr);
    return acc;
  }, {} as Record<string | number, CustomAttributeDefinition[]>);

  const unsectionedAttrs = attributesBySection['unsectioned'] || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Admin Templates
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Configure custom attributes for each entity type
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {ENTITY_TYPES.map((et) => (
            <Tab key={et.value} label={et.label} />
          ))}
        </Tabs>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {/* Actions */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<FolderIcon />}
              onClick={() => handleOpenSectionDialog()}
            >
              Add Section
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenAttrDialog()}
            >
              Add Attribute
            </Button>
          </Stack>

          {/* Sections and Attributes */}
          {sections.length === 0 && unsectionedAttrs.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No custom attributes defined for {ENTITY_TYPES[activeTab].label}.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Start by adding a section or attribute.
              </Typography>
            </Paper>
          ) : (
            <>
              {/* Unsectioned attributes */}
              {unsectionedAttrs.length > 0 && (
                <Paper sx={{ mb: 2 }}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      General Attributes
                    </Typography>
                  </Box>
                  <List dense>
                    {unsectionedAttrs.map((attr) => (
                      <AttributeListItem
                        key={attr.id}
                        attr={attr}
                        onEdit={() => handleOpenAttrDialog(attr)}
                        onDelete={() => setDeleteDialog({ open: true, type: 'attribute', id: attr.id, name: attr.label })}
                        onToggleActive={() => handleToggleActive(attr)}
                      />
                    ))}
                  </List>
                </Paper>
              )}

              {/* Sections */}
              {sections.map((section) => (
                <Accordion key={section.id} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, mr: 2 }}>
                      <DragIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography fontWeight={600}>{section.name}</Typography>
                      {section.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                          {section.description}
                        </Typography>
                      )}
                      <Chip
                        size="small"
                        label={`${(attributesBySection[section.id] || []).length} attrs`}
                        sx={{ ml: 2 }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                      <IconButton size="small" onClick={() => handleOpenSectionDialog(section)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog({ open: true, type: 'section', id: section.id, name: section.name })}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List dense>
                      {(attributesBySection[section.id] || []).map((attr) => (
                        <AttributeListItem
                          key={attr.id}
                          attr={attr}
                          onEdit={() => handleOpenAttrDialog(attr)}
                          onDelete={() => setDeleteDialog({ open: true, type: 'attribute', id: attr.id, name: attr.label })}
                          onToggleActive={() => handleToggleActive(attr)}
                        />
                      ))}
                      {(attributesBySection[section.id] || []).length === 0 && (
                        <ListItem>
                          <ListItemText
                            secondary="No attributes in this section"
                            sx={{ textAlign: 'center' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </>
          )}
        </Box>
      )}

      {/* Section Dialog */}
      <Dialog open={sectionDialogOpen} onClose={() => setSectionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSection ? 'Edit Section' : 'New Section'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Section Name"
            fullWidth
            required
            value={sectionForm.name}
            onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={sectionForm.description}
            onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSection} disabled={!sectionForm.name.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Attribute Dialog */}
      <Dialog open={attrDialogOpen} onClose={() => setAttrDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAttr ? 'Edit Attribute' : 'New Attribute'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Attribute Name (code)"
            fullWidth
            required
            value={attrForm.name}
            onChange={(e) => setAttrForm({ ...attrForm, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() })}
            helperText="Unique identifier (letters, numbers, underscores)"
          />
          <TextField
            margin="dense"
            label="Label"
            fullWidth
            required
            value={attrForm.label}
            onChange={(e) => setAttrForm({ ...attrForm, label: e.target.value })}
            helperText="Display name shown to users"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Field Type</InputLabel>
            <Select
              value={attrForm.field_type}
              label="Field Type"
              onChange={(e) => setAttrForm({ ...attrForm, field_type: e.target.value as FieldType })}
            >
              {FIELD_TYPES.map((ft) => (
                <MenuItem key={ft.value} value={ft.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {ft.icon}
                    {ft.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Section</InputLabel>
            <Select
              value={attrForm.section_id || ''}
              label="Section"
              onChange={(e) => setAttrForm({ ...attrForm, section_id: e.target.value ? Number(e.target.value) : null })}
            >
              <MenuItem value="">
                <em>No section (General)</em>
              </MenuItem>
              {sections.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={attrForm.is_required}
                onChange={(e) => setAttrForm({ ...attrForm, is_required: e.target.checked })}
              />
            }
            label="Required field"
          />
          <Divider sx={{ my: 2 }} />
          <TextField
            margin="dense"
            label="Default Value"
            fullWidth
            value={attrForm.default_value}
            onChange={(e) => setAttrForm({ ...attrForm, default_value: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Placeholder"
            fullWidth
            value={attrForm.placeholder}
            onChange={(e) => setAttrForm({ ...attrForm, placeholder: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Help Text"
            fullWidth
            value={attrForm.help_text}
            onChange={(e) => setAttrForm({ ...attrForm, help_text: e.target.value })}
          />
          {attrForm.field_type === 'SELECT' && (
            <TextField
              margin="dense"
              label="Options"
              fullWidth
              multiline
              rows={4}
              value={attrForm.options}
              onChange={(e) => setAttrForm({ ...attrForm, options: e.target.value })}
              helperText="One option per line. Format: value:label or just label"
              placeholder="option1:Option 1&#10;option2:Option 2"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttrDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveAttr}
            disabled={!attrForm.name.trim() || !attrForm.label.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}>
        <DialogTitle>Delete {deleteDialog.type === 'section' ? 'Section' : 'Attribute'}</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.name}"?
            {deleteDialog.type === 'attribute' && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                This will also delete all values stored for this attribute.
              </Typography>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Attribute List Item Component
function AttributeListItem({
  attr,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  attr: CustomAttributeDefinition;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <ListItem
      sx={{
        opacity: attr.is_active ? 1 : 0.5,
        borderBottom: 1,
        borderColor: 'divider',
        '&:last-child': { borderBottom: 0 },
      }}
    >
      <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
        <DragIcon sx={{ color: 'text.secondary', mr: 1 }} />
        {getFieldIcon(attr.field_type)}
      </Box>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography fontWeight={500}>{attr.label}</Typography>
            <Chip size="small" label={attr.name} variant="outlined" sx={{ fontSize: '0.7rem' }} />
            {attr.is_required && <Chip size="small" label="Required" color="error" />}
            {!attr.is_active && <Chip size="small" label="Inactive" />}
          </Box>
        }
        secondary={attr.help_text}
      />
      <ListItemSecondaryAction>
        <Tooltip title={attr.is_active ? 'Deactivate' : 'Activate'}>
          <IconButton size="small" onClick={onToggleActive}>
            <BooleanIcon color={attr.is_active ? 'success' : 'disabled'} />
          </IconButton>
        </Tooltip>
        <IconButton size="small" onClick={onEdit}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onDelete}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
}
