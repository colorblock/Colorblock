export const shortAddress = (address) => {
  return address.length > 10 ? address.slice(0, 4) + '***' + address.slice(-4) : address;
};

export const capitalize = (s) => {
  if (s) {
    return s[0].toUpperCase() + s.slice(1);
  } else {
    return s;
  }
};