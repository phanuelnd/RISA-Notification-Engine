import React, { useMemo } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Box
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type{ ModalProps } from '../../types';

// Static styles moved outside component to prevent re-creation
const dialogPaperStyles = {
  borderRadius: 2,
  boxShadow: 24,
  maxHeight: '90vh'
};

const backdropStyles = {
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)'
};

const titleStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid',
  borderColor: 'divider',
  py: 2,
  px: 3
};

const titleTextStyles = { 
  fontSize: '1.25rem', 
  fontWeight: 600, 
  color: 'text.primary',
  m: 0
};

const closeButtonStyles = {
  color: 'text.secondary',
  '&:hover': {
    backgroundColor: 'action.hover',
    color: 'text.primary'
  }
};

const contentStyles = { p: 3, overflow: 'auto' };

/**
 * Reusable Modal component with blur backdrop overlay
 * Supports keyboard navigation and click-outside-to-close
 * Uses MUI Dialog with custom backdrop for better UX
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children
}) => {
  // Memoize size-dependent values to prevent unnecessary re-renders
  const maxWidth = useMemo(() => {
    switch (size) {
      case 'sm': return 'sm';
      case 'lg': return 'lg';
      case 'xl': return 'xl';
      default: return 'md';
    }
  }, [size]);

  // Memoize sx prop to maintain stable reference
  const dialogSx = useMemo(() => ({
    '& .MuiDialog-paper': dialogPaperStyles
  }), []);

  // Memoize slotProps for backdrop to prevent re-renders
  const slotProps = useMemo(() => ({
    backdrop: {
      sx: backdropStyles
    }
  }), []);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth={maxWidth as any}
      fullWidth
      sx={dialogSx}
      slotProps={slotProps}
    >
      {/* Header */}
      {(title || onClose !== undefined) && (
        <DialogTitle sx={titleStyles}>
          {title && (
            <Box component="h2" sx={titleTextStyles}>
              {title}
            </Box>
          )}
          {onClose && (
            <IconButton
              onClick={onClose}
              size="small"
              sx={closeButtonStyles}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </DialogTitle>
      )}
      
      {/* Content */}
      <DialogContent sx={contentStyles}>
        {children}
      </DialogContent>
    </Dialog>
  );
};
