'use client'
import React from 'react';
import { Box, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import AddIcon from '@mui/icons-material/Add';

interface MessageContentProps {
  content: string;
  isUser: boolean;
  isFAQ?: boolean;
  suggestions?: string[];
  onFAQClick?: (question: string) => void;
}

const MessageContent: React.FC<MessageContentProps> = ({ 
  content, 
  isUser, 
  isFAQ, 
  suggestions,
  onFAQClick 
}) => {
  if (isUser) {
    return (
      <Typography 
        variant="h4" 
        sx={{ 
          fontSize: '1.75rem',
          fontWeight: 500,
          mb: 3,
          color: 'text.primary',
          pt: 2,
        }}
      >
        {content}
      </Typography>
    );
  }

  if (isFAQ && suggestions) {
    return (
      <Box>
        {content && <Typography sx={{ mb: 1 }}>{content}</Typography>}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {suggestions.map((suggestion, index) => (
            <Box
              key={index}
              onClick={() => onFAQClick?.(suggestion)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
              <Typography sx={{ color: 'text.primary', flex: 1, pr: 2 }}>
                {suggestion}
              </Typography>
              <AddIcon sx={{ color: 'primary.main' }} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return <BotMessage content={content} />;
};

const BotMessage: React.FC<{ content: string }> = ({ content }) => (
  <Box>
    <BotHeader />
    <MarkdownContent content={content} />
  </Box>
);

const BotHeader: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      backgroundColor: (theme) => 
        theme.palette.mode === 'light' 
          ? theme.palette.grey[200] 
          : theme.palette.background.paper,
      borderRadius: '16px',
      padding: '4px 16px 4px 8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      width: 'fit-content',
      mb: 1.5
    }}
  >
    <Box
      component="img"
      src="/stonkie.png"
      alt="Stonkie Avatar"
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        flexShrink: 0,
      }}
    />
    <Typography sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
      Stonkie
    </Typography>
  </Box>
);

const MarkdownContent: React.FC<{ content: string }> = ({ content }) => (
  <Box>
    <ReactMarkdown
      components={{
        h2: ({ children }) => (
          <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1, mb: 2 }}>
            {children}
          </Typography>
        ),
        p: ({ children }) => (
          <Typography sx={{ mb: 1.5, color: 'text.primary' }}>{children}</Typography>
        ),
        strong: ({ children }) => (
          <Typography component="span" sx={{ fontWeight: 'bold' }}>
            {children}
          </Typography>
        ),
        ul: ({ children }) => (
          <Box component="ul" sx={{ pl: 2, mb: 1.5 }}>
            {children}
          </Box>
        ),
        li: ({ children }) => (
          <Typography component="li" sx={{ mb: 0.5 }}>
            {children}
          </Typography>
        ),
        table: ({ children }) => (
          <Box sx={{ overflowX: 'auto', mb: 2 }}>
            <table style={{ 
              borderCollapse: 'collapse', 
              width: '100%',
              fontSize: '0.875rem'
            }}>
              {children}
            </table>
          </Box>
        ),
        th: ({ children }) => (
          <th style={{ 
            border: '1px solid #ddd',
            padding: '8px',
            backgroundColor: '#f5f5f5',
            textAlign: 'left'
          }}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td style={{ 
            border: '1px solid #ddd',
            padding: '8px'
          }}>
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  </Box>
);

export default MessageContent; 