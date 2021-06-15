console.log(process.env);
const getServerUrl = () => {
  // read env params
  switch (process.env.REACT_APP_STAGE) {
    case 'dev':
      return 'http://api.colorblockart.com';
    case 'prod':
      return 'https://api.colorblock.art';
    default:
      return 'http://localhost:5000';
  }
};
export const serverUrl = getServerUrl();
export const walletUrl = 'http://127.0.0.1:9467/v1';

export const cookiesKey = 'colorblock';
export const cookiesPersistKey = 'persist:' + cookiesKey;

export const moduleInTest = process.env.REACT_APP_PACT_MODULE_TEST || false;
export const contractModules = moduleInTest ? {
  colorblock: 'free.colorblock-test',
  colorblockMarket: 'free.colorblock-market-test',
  colorblockGasStation: 'free.colorblock-gas-station-test',
  marketPoolAccount: 'colorblock-market-pool-test',
  gasPayerAccount: 'colorblock-gas-payer-test'
} : {
  colorblock: 'free.colorblock',
  colorblockMarket: 'free.colorblock-market',
  colorblockGasStation: 'free.colorblock-gas-station',
  marketPoolAccount: 'colorblock-market-pool',
  gasPayerAccount: 'colorblock-gas-payer'
};

export const precisionConfig = {
  priceUnit: 12,
  amountUnit: 0
};

export const signConfig = {
  networkId: 'mainnet01',
  chainId: '0',
  gasPrice: 0.000000000001,
  gasLimit: 150000,
  minGasLimit: 1000,
  gasLimitRate: 3.0
};

export const itemConfig = {
  minSupply: 1,
  maxSupply: 9999,
  maxTitleLength: 64,
  maxDescriptionLength: 300,
  minFrameWidth: 2,
  minFrameHeight: 2,
  maxFrameWidth: 128,
  maxFrameHeight: 128,
  maxFrameCount: 16
};

export const collectionConfig = {
  lengthOfId: 16
};

export const marketConfig = {
  fees: 0.01
};

export const creatorConfig = {
  maxWidth: 16,
  maxHeight: 16
};
