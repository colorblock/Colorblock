import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import App from './App';

const Root = ({ store, persistor }) => {

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  );

};

Root.propTypes = {
  store: PropTypes.object.isRequired
};

export default Root;

