import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from './app/shared/context/ThemeContext';
import { lightTheme, darkTheme } from './app/shared/theme/themes';
import { AppShell } from './app/core/AppShell';

function AppContent() {
  const { actualMode } = useTheme();
  const theme = actualMode === 'dark' ? darkTheme : lightTheme;

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell />
    </MuiThemeProvider>
  );
}

export default AppContent;
