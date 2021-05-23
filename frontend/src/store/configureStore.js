import { createStore } from 'redux';
import reducer from './reducers/reducer';
import { loadStateFromCookies } from '../utils/storage';

const preloadedState = loadStateFromCookies();
console.log('preloadedState', preloadedState);

const configureStore = createStore(
  reducer, 
  preloadedState,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

export default configureStore;