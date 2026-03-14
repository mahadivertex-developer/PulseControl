import { ThemeProvider } from './app/shared/context/ThemeContext';
import AppContent from './AppContent';

function App() {
	return (
		<ThemeProvider>
			<AppContent />
		</ThemeProvider>
	);
}

export default App;
