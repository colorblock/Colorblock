import produce from 'immer';
import * as types from '../actions/actionTypes';

const initWallet = () => {
  const wallet = {
    isModalOpen: false
  };
  return wallet;
};

const switchWalletModal = (wallet) => {
  wallet.isModalOpen = !wallet.isModalOpen;
  return wallet;
};

const setAddressList = (wallet, keyList) => {
  wallet.keyList = keyList;
  return wallet;
};

const setAccountAddress = (wallet, address) => {
  wallet.address = address;
  return wallet;
};

const setWallet = (wallet, _wallet) => {
  wallet = {
    ...wallet,
    ..._wallet
  };
  return wallet;
};

const wallet = produce((wallet, action) => {
  switch (action.type) {
    case types.SWITCH_WALLET_MODAL:
      return switchWalletModal(wallet);
    case types.SET_ADDRESS_LIST:
      return setAddressList(wallet, action.keyList);
    case types.SET_ACCOUNT_ADDRESS:
      return setAccountAddress(wallet, action.address);
    case types.SET_WALLET:
      return setWallet(wallet, action.wallet);
    default:
  }
  return wallet;
}, initWallet());

export default wallet;