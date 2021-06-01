import { createStore } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { cookiesKey } from '../config';
import reducer from './reducers/reducer';

const persistConfig = {
  key: cookiesKey,
  storage,
  blacklist: ['creator']
};

const persistedReducer = persistReducer(persistConfig, reducer);

const configureStore = () => {
  let store = createStore(
    persistedReducer,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  );
  let persistor = persistStore(store);
  return { store, persistor };
};

export default configureStore;