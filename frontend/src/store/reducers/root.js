import produce from 'immer';
import * as types from '../actions/actionTypes';

const initRoot = () => {
  const root = {
    loading: false
  };
  return root;
};

const showLoading = (root) => {
  root.loading = true;
  return root;
};

const hideLoading = (root) => {
  root.loading = false;
  return root;
};

const root = produce((root, action) => {
  switch (action.type) {
    case types.SHOW_LOADING:
      return showLoading(root);
    case types.HIDE_LOADING:
      return hideLoading(root);
    default:
  }
  return root;
}, initRoot());

export default root;