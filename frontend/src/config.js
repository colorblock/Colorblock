export const devMode = process.env.NODE_ENV;
const getServerUrl = (devMode) => {
  switch (devMode) {
    case 'development':
      return 'http://colorblockart.com:5000';
    case 'production':
      return 'https://colorblock.art';
    default:
      return 'http://localhost:5000';
  }
};
export const serverUrl = getServerUrl(devMode);
export const walletUrl = 'http://127.0.0.1:9467/v1';

export const cookiesKey = 'colorblock';
export const cookiesPersistKey = 'persist:' + cookiesKey;

export const itemConfig = {
  minSupply: 1,
  maxSupply: 9999
};
