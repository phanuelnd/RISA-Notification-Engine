import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  ContentCopy as ContentCopyIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface VariablesPanelProps {
  variables: string[];
  onVariableClick: (variable: string) => void;
}

/**
 * Variables Panel Component
 * Displays available CSV fields as clickable variables
 * Clicking a variable inserts it into the editor at cursor position
 */
export const VariablesPanel: React.FC<VariablesPanelProps> = ({
  variables,
  onVariableClick,
}) => {
  const handleCopy = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
  };

  if (variables.length === 0) {
    return (
      <Paper
        sx={{
          p: 2,
          bgcolor: 'grey.50',
          border: '1px dashed',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Typography variant="body2" color="text.secondary">
            Upload a CSV file to see available variables
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Available Variables
        </Typography>
        <Tooltip title="Click a variable to insert it into your message">
          <InfoIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
        </Tooltip>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        {variables.map((variable) => (
          <Chip
            key={variable}
            label={`{{${variable}}}`}
            onClick={() => onVariableClick(variable)}
            onDelete={() => handleCopy(variable)}
            deleteIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
            size="small"
            sx={{
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'primary.50',
                color: 'primary.main',
              },
              fontFamily: 'monospace',
              fontSize: '0.75rem',
            }}
            color="primary"
            variant="outlined"
          />
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
        Click to insert • Right-click to copy
      </Typography>
    </Paper>
  );
};

