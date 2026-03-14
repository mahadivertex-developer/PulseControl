/// <reference types="react-scripts" />

// Custom environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    REACT_APP_API_URL?: string;
    REACT_APP_API_TIMEOUT?: string;
  }
}
