import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';

import * as actions from '../../store/actions/actionCreator';
import { getSignedCmd, getWalletAccounts } from '../../utils/sign';
import { shortAddress } from '../../utils/polish';
import { serverUrl, contractModules } from '../../config';

export const Wallet = (props) => {
  const { wallet, switchWalletModal, setPublicKeyList, setAccountAddress } = props;
  const [selectedKey, setSelectedKey] = useState('');

  const clickFetchAccounts = async () => {
    const accounts = await getWalletAccounts();
    if (Array.isArray(accounts)) {
      setPublicKeyList(accounts);
    }
  };

  const clickConfirmAccount = async () => {
    let address;
    if (selectedKey) {
      // if key is chosen
      address = selectedKey;
    } else {
      // if not chosen, use first one
      if (wallet.keyList && wallet.keyList.length > 0) {
        address = wallet.keyList[0];
      } else {
        alert('please choose address!');
        return;
      }
    }

    const account = address;
    const cmd = {
      code: `(${contractModules.colorblock}.validate-guard "${account}")`,
      caps: [],
      sender: account,
      signingPubKey: account,
      gasLimit: 0
    };
    const signedCmd = await getSignedCmd(cmd, {
      account
    });
    console.log(signedCmd);
    if (!signedCmd) {
      return;
    }
    const result = await fetch(`${serverUrl}/login`, signedCmd).then(res => res.json());
    console.log(result);

    setAccountAddress(address);  // set address
    switchWalletModal();  // close modal
    setSelectedKey('');  // clear selected key
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
              <img className='w-24 m-auto' src='/img/zelcore.png' alt='Zelcore' />
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
            <p className='font-bold'>Third step</p>
            <p className='my-2'>select your Zelcore account below.</p>
            <div className='relative w-2/5 mx-auto'>
              <select
                className='w-full border border-black px-10 rounded-xl'
                onChange={ (e) => setSelectedKey(e.target.value) }
              >
                { wallet.keyList &&
                wallet.keyList.map((key, index) => (
                  <option key={index} value={key}>
                    {shortAddress(key)}
                  </option>
                ))
                }
              </select>
              <div className='absolute top-0 left-2 mx-2 text-gray-300 h-full flex items-center'>
                <FontAwesomeIcon icon={fa.faCaretDown} />
              </div>
            </div>
          </div>
          <div className='my-5'>
            <p className='font-bold'>Last step</p>
            <p className='my-2'>Login into colorblock within Zelcore.</p>
            <button
              type='button'
              className='bg-red-500 text-white px-3 py-1'
              onClick={ () => clickConfirmAccount() }
            >
              Auth in Zelcore
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
