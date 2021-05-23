export const saveStateToCookies = (state, partialKey=null) => {
  // set cookies and the mode full/partial is depended on partialKey
  const preState = loadStateFromCookies();
  let newState;
  if (partialKey == null) {
    newState = state;
  } else {
    newState = preState;
    newState[partialKey] = state[partialKey];
  }
  const newStateString = JSON.stringify(newState);
  localStorage.setItem('state', newStateString);
};

export const hasStateInCookies = () => {
  const state = loadStateFromCookies();
  const stateString = JSON.stringify(state)
  return stateString !== '{}';
};

export const loadStateFromCookies = () => {
  const stateString = localStorage.getItem('state') || '{}';
  const state = JSON.parse(stateString);
  return state;
};