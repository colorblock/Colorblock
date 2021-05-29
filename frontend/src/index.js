import React from 'react';
import ReactDom from 'react-dom';

import configureStore from './store/configureStore';
import Root from './components/Root';
import './css/index.css';

const { store, persistor } = configureStore();

ReactDom.render(
  <Root store={store} persistor={persistor} />, 
  document.getElementById('app')
);