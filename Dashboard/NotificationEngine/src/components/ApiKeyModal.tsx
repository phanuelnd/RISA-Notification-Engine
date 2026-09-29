import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Alert,
} from '@mui/material';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey?: string;
}

/**
 * API Key Modal Component
 * Allows users to enter or update their API key
 */
export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentApiKey,
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setError('API key is required');
      return;
    }
    onSave(trimmedKey);
    setApiKey('');
    setError(null);
    onClose();
  };

  const handleClose = () => {
    setApiKey(currentApiKey || '');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="API Key Configuration"
      size="sm"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Alert severity="info" sx={{ mb: 1 }}>
          <Typography variant="body2">
            Enter your service API key to send notifications. This key will be stored locally in your browser.
          </Typography>
        </Alert>

        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
            API Key
          </Typography>
          <TextField
            fullWidth
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setError(null);
            }}
            placeholder="Enter your API key"
            error={!!error}
            helperText={error}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
                fontSize: '0.875rem',
              },
            }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save API Key
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

