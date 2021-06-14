export const shortAddress = (address) => {
  return address.slice(0, 4) + '****' + address.slice(-4);
};

export const capitalize = (s) => {
  if (s) {
    return s[0].toUpperCase() + s.slice(1);
  } else {
    return s;
  }
};