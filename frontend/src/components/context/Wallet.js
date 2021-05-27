import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';
import * as actions from '../../store/actions/actionCreator';
import { getWalletAccounts } from '../../utils/sign';

export const Wallet = (props) => {
  const { wallet, switchWalletModal, setPublicKeyList, setAccountAddress } = props;
  const [selectedKey, setSelectedKey] = useState('');

  const clickFetchAccounts = async () => {
    const accounts = await getWalletAccounts();
    setPublicKeyList(accounts);
  };

  const clickConfirmAccount = () => {
    if (selectedKey) {
      // if key is chosen
      setAccountAddress(selectedKey);
    } else {
      // if not chosen, use first one
      if (wallet.keyList && wallet.keyList.length > 0) {
        setAccountAddress(wallet.keyList[0]);
      } else {
        alert('please choose address!')
      }
    }
    switchWalletModal();
    setSelectedKey('');
  };

  return wallet.isModalOpen ? (
    <div data-role='wallet modal' className='fixed top-0 left-0 w-full min-h-full bg-white bg-opacity-90 z-50 text-work'>
      <div className='relative mt-20 w-5/6 mx-auto border border-red-500 bg-white'>
        <button data-role='modal exit' className='absolute right-4 top-3' onClick={ () => switchWalletModal() }>
          <FontAwesomeIcon icon={fa.faTimes} />
        </button>
        <div className='w-3/4 mx-auto text-center'>
          <div className='my-5 font-bold text-lg'>
            <span className='pb-1 border-b border-black'>Connect To Zelcore</span>
          </div>
          <div className='my-5'>
            <p className='font-bold'>First step</p>
            <p className='my-2'>Log into your Zelcore wallet, and turn on server option. </p>
            <div>
              <img className='w-24 m-auto m-2' src='/img/zelcore.png' alt='Zelcore' />
            </div>
          </div>
          <div className='my-5'>
            <p className='font-bold'>Second step</p>
            <p className='my-2'>Click the button below to connect to wallet, and confirm on the wallet page.</p>
            <div>
              <button
                type='button'
                className='bg-red-500 text-white px-3 py-1'
                onClick={ () => clickFetchAccounts() }
              >
                Connect to Zelcore
              </button>
            </div>
          </div>
          <div className='my-5'>
            <p className='font-bold'>Last step</p>
            <p className='my-2'>select your Zelcore account below.</p>
            <select
              className='block w-2/5 mx-auto text-center border border-black'
              onChange={ (e) => setSelectedKey(e.target.value) }
            >
              { wallet.keyList &&
              wallet.keyList.map((key, index) => (
                <option key={index}>
                  {key}
                </option>
              ))
              }
            </select>
          </div>
          <div className='my-5'>
            <button
              type='button'
              className='bg-red-500 text-white px-3 py-1'
              onClick={ () => clickConfirmAccount() }
            >
              Let's start
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : 
  <></>
  ;
};

Wallet.propTypes = {
  wallet: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  wallet: state.wallet
});

const mapDispatchToProps = dispatch => ({
  switchWalletModal: () => dispatch(actions.switchWalletModal()),
  setPublicKeyList: (keyList) => dispatch(actions.setPublicKeyList(keyList)),
  setAccountAddress: (address) => dispatch(actions.setAccountAddress(address))
});

export default connect(mapStateToProps, mapDispatchToProps)(Wallet);
