import { combineReducers } from 'redux';
import creator from './creator';
import wallet from './wallet';

const reducer = combineReducers({
  creator,
  wallet
});

export default reducer;