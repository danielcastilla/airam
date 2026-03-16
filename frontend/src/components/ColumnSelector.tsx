import { useState } from 'react';
import {
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Tooltip,
  Typography,
  Divider,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

export interface ColumnDefinition {
  id: string;
  label: string;
  defaultVisible: boolean;
  isCustom?: boolean;
}

interface ColumnSelectorProps {
  columns: ColumnDefinition[];
  visibleColumns: Set<string>;
  onColumnToggle: (columnId: string) => void;
}

export default function ColumnSelector({
  columns,
  visibleColumns,
  onColumnToggle,
}: ColumnSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const defaultColumns = columns.filter(c => !c.isCustom);
  const customColumns = columns.filter(c => c.isCustom);

  return (
    <>
      <Tooltip title="Configure visible columns">
        <IconButton onClick={handleOpen} size="small">
          <VisibilityIcon />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityIcon />
            <Typography variant="h6">Configure Columns</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, bgcolor: 'grey.100' }}>
            Default Fields
          </Typography>
          <List dense>
            {defaultColumns.map((column) => (
              <ListItem key={column.id} disablePadding>
                <ListItemButton onClick={() => onColumnToggle(column.id)}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Checkbox
                      edge="start"
                      checked={visibleColumns.has(column.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText primary={column.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          {customColumns.length > 0 && (
            <>
              <Divider />
              <Typography variant="subtitle2" sx={{ px: 2, py: 1, bgcolor: 'grey.100' }}>
                Custom Attributes
              </Typography>
              <List dense>
                {customColumns.map((column) => (
                  <ListItem key={column.id} disablePadding>
                    <ListItemButton onClick={() => onColumnToggle(column.id)}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Checkbox
                          edge="start"
                          checked={visibleColumns.has(column.id)}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText primary={column.label} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook to manage column visibility state
export function useColumnVisibility(columns: ColumnDefinition[]) {
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    // Initialize with default visible columns
    return new Set(columns.filter(c => c.defaultVisible).map(c => c.id));
  });

  const toggleColumn = (columnId: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  const isVisible = (columnId: string) => visibleColumns.has(columnId);

  return { visibleColumns, toggleColumn, isVisible };
}
