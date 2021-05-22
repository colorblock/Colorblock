export const devMode = process.env.NODE_ENV === 'development';
export const serverUrl = devMode ? 'http://localhost:5000' : '';
export const walletUrl = 'http://127.0.0.1:9467/v1';