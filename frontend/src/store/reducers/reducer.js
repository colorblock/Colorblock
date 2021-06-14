import { combineReducers } from 'redux';
import creator from './creator';
import wallet from './wallet';
import root from './root';

const reducer = combineReducers({
  creator,
  wallet,
  root
});

export default reducer;