import { precisionConfig } from '../config';

export const randomId = (length) => {
  var result           = [];
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
  }
  return result.join('');
};

export const toPrecision = (number, precision) => {
  return parseFloat(number.toFixed(precision));
};

export const toPricePrecision = (number) => {
  return toPrecision(number, precisionConfig.priceUnit);
};
export const toAmountPrecision = (number) => {
  return toPrecision(number, precisionConfig.amountUnit);
};

export const getTimestamp = () => {
  return Math.floor(new Date().getTime() / 1000);
};

export const firstUrl = (urls) => {
  if (Array.isArray(urls)) {
    return urls[0]
  } else {
    return JSON.parse(urls)[0];
  }
};
export const secondUrl = (urls) => {
  if (Array.isArray(urls)) {
    return urls[1]
  } else {
    return JSON.parse(urls)[1];
  }
};