import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';

interface LandingPageProps {
  onLoginClick: () => void;
}

export function LandingPage({ onLoginClick }: LandingPageProps) {
  return (
    <Box
      sx={(theme) => ({
        minHeight: '100vh',
        background:
          theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at 20% 20%, rgba(241,196,15,0.2), transparent 40%), linear-gradient(120deg, #0b1320 0%, #18293a 50%, #223a4c 100%)'
            : 'radial-gradient(circle at 20% 20%, rgba(241,196,15,0.22), transparent 40%), linear-gradient(120deg, #12303a 0%, #245164 50%, #2f5e74 100%)',
        display: 'flex',
        alignItems: 'center',
      })}
    >
      <Container maxWidth="lg">
        <Paper
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={3}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Pulse Visual ERP
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              Multi-company garment manufacturing platform for merchandising, store, cutting, sewing, washing,
              finishing, packing, shipment and commercial operations.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" size="large" onClick={onLoginClick}>
                Log In
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
