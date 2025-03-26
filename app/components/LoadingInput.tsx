'use client'
import React from 'react';
import { Box, Typography } from '@mui/material';

const LoadingInput: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
      borderRadius: 2,
      p: 2,
      position: 'absolute',
      bottom: 32,
      left: 32,
      right: 32,
    }}
  >
    <Box
      component="img"
      src="/stonkie.png"
      alt="Stonkie thinking"
      sx={{
        width: 24,
        height: 24,
        animation: 'spin 2s linear infinite',
        '@keyframes spin': {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
      }}
    />
    <Typography color="text.secondary">
      Stonkie is thinking...
    </Typography>
  </Box>
);

export default LoadingInput; 