/**
 * Frontend Configuration
 * 
 * Update these values based on your deployment environment
 */

export const config = {
  // API Base URL
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3002/api',
  
  // API request timeout (milliseconds)
  apiTimeout: 30000,
  
  // App info
  appName: 'PulseControlERP',
  appVersion: '1.0.0',
  
  // Development mode
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // Feature flags
  features: {
    enableNotifications: true,
    enableAnalytics: false,
  },
};

// For production deployment, create a .env file with:
// REACT_APP_API_URL=https://api.yourcompany.com/api
//
// Or update the apiUrl above directly

export default config;
