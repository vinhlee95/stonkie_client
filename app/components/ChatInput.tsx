import React from 'react';
import { Box, TextField, Button, InputAdornment } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  ticker?: string;
  messagesExist: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  isLoading,
  ticker,
  messagesExist,
  onInputChange,
  onSubmit
}) => (
  <form onSubmit={onSubmit} style={{ 
    marginBottom: '12px',
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    paddingLeft: '32px',
    paddingRight: '32px'
  }}>
    <Box>
      <TextField
        fullWidth
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder={messagesExist ? "Ask follow up..." : (ticker ? `Ask me anything about ${ticker}...` : "Ask about financial analysis...")}
        disabled={isLoading}
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            pr: '14px',
            backgroundColor: 'background.paper',
            boxShadow: '0px 12px 28px rgba(0, 0, 0, 0.25)',
            '& input': {
              py: 1.5
            }
          }
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                sx={{
                  minWidth: '30px',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  p: 0,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  },
                  '&:disabled': {
                    backgroundColor: 'grey.300',
                    color: 'grey.500'
                  }
                }}
              >
                <KeyboardArrowUpIcon fontSize="small" />
              </Button>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  </form>
);

export default ChatInput; 