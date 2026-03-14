import type { ChangeEvent, FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from '@mui/material';
import { LoginCredentials } from '../shared/types/auth';

interface LoginPageProps {
  credentials: LoginCredentials;
  loading: boolean;
  error: string | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent) => void;
  onBack?: () => void;
}

export function LoginPage({ credentials, loading, error, onChange, onSubmit, onBack }: LoginPageProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Card elevation={10} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#667eea', fontWeight: 'bold' }}>
              PulseControlERP
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Multi-Company Garment Manufacturing ERP
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email or User ID"
              name="email"
              type="text"
              value={credentials.email}
              onChange={onChange}
              required
              fullWidth
              disabled={loading}
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={credentials.password}
              onChange={onChange}
              required
              fullWidth
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !credentials.email || !credentials.password}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                py: 1.5,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>
            {onBack && (
              <Button type="button" variant="text" fullWidth onClick={onBack} disabled={loading}>
                Back to Landing
              </Button>
            )}
          </Box>

          <Box
            sx={{
              mt: 3,
              p: 2,
              bgcolor: 'action.hover',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" display="block" sx={{ mb: 1, color: 'text.secondary' }}>
              Demo Credentials (for testing):
            </Typography>
            <Typography variant="caption" display="block" sx={{ color: 'text.primary' }}>
              Email: admin@example.com
            </Typography>
            <Typography variant="caption" display="block" sx={{ color: 'text.primary' }}>
              Password: password123
            </Typography>
          </Box>
        </Card>
      </Container>
    </Box>
  );
}
