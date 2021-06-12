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