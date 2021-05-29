import { cookiesPersistKey } from '../config';

export const hasStateInCookies = () => {
  const state = loadStateFromCookies();
  const stateString = JSON.stringify(state)
  return stateString !== '{}';
};

export const loadStateFromCookies = () => {
  const stateString = localStorage.getItem(cookiesPersistKey) || '{}';
  const state = JSON.parse(stateString);
  return state;
};