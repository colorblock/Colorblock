import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

import * as actions from '../../store/actions/actionCreator';
import { getSignedCmd, getWalletAccounts } from '../../utils/sign';
import { shortAddress } from '../../utils/polish';
import { serverUrl, contractModules } from '../../config';
import { capitalize } from '../../utils/polish';

export const Wallet = (props) => {
  const { wallet, switchWalletModal, setAddressList, setAccountAddress } = props;
  const [selectedKey, setSelectedKey] = useState('');
  const [walletType, setWalletType] = useState('');
  const [localAddress, setLocalAddress] = useState(null);
  const [mouseOverBack, setMouseOverBack] = useState(false);

  const walletName = capitalize(walletType);

  const clickFetchAccounts = async () => {
    const accounts = await getWalletAccounts();
    if (Array.isArray(accounts)) {
      setAddressList(accounts);
    } else if (accounts) {
      toast.error('Accounts are illegal');
    }
  };

  const clickConnect = async (source) => {
    let address;
    if (source === 'input') {
      if (!localAddress) {
        toast.error('Please enter address first!');
        return;
      }
      address = localAddress;
    } else if (selectedKey) {
      // if key is chosen
      address = selectedKey;
    } else {
      // if not chosen, use first one
      if (wallet.keyList && wallet.keyList.length > 0) {
        address = wallet.keyList[0];
      } else {
        toast.error('Please fetch accounts first!');
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
    const result = await fetch(`${serverUrl}/login`, signedCmd)
      .then(res => res.json())
      .catch(() => {
        toast.error('Login failed becasue of network error');
      });
    console.log(result);

    if (result) {
      if (result.status === 'success') {
        setAccountAddress(address);  // set address
        switchWalletModal();  // close modal
        setSelectedKey('');  // clear selected key
        toast.success('login successfully');
      } else {
        toast.error(result.data, { autoClose: 10000 });
      }
    }
  };

  useEffect(() => {
    // fill input with wallet address everytime modal is open
    setLocalAddress(wallet.address);
  }, [wallet]);

  return wallet.isModalOpen ? (
    <div data-role='wallet modal' className='fixed top-0 left-0 w-full min-h-full bg-white bg-opacity-90 z-50 text-work'>
      <div className='mt-32 w-120 px-5 mx-auto border rounded-lg bg-white'>
        <div className='relative my-10 flex items-center'>
          <span className='w-full font-semibold text-center'>Connect To a Wallet</span>
          <button data-role='modal exit' className='absolute right-10' onClick={ () => switchWalletModal() }>
            <FontAwesomeIcon icon={fa.faTimes} />
          </button>
        </div>
        { !walletType &&
          <div className='flex flex-col items-center justify-center px-5 font-base'>
            <button className='wallet-tab' onClick={ () => setWalletType('zelcore') }>
              Zelcore
              <img src='/img/zelcore.png' className='h-full rounded-xl' alt='zelcore' />
            </button>
            <button className='wallet-tab' onClick={ () => setWalletType('chainweaver') }>
              Chainweaver
              <img src='/img/chainweaver.png' className='h-full rounded-xl' alt='chainweaver' />
            </button>
            <button className='wallet-tab' onClick={ () => toast.warning('Torus is not supported yet') }>
              Torus
              <img src='/img/torus.png' className='h-full rounded-xl' alt='torus' />
            </button>
            <div className='mt-16 mb-5 mx-10 text-center text-xs'>
              New to Kadena?
              <a href='https://www.kadena.io/chainweaver' className='text-cb-pink ml-1 underline'>
                Learn more about wallets
              </a>
            </div>
          </div>
        }
        { walletType &&
          <div className='flex flex-col items-center justify-center px-5 font-base text-sm pb-5'>
            <p className='font-semibold text-center'>Follow instructions in your {walletName} wallet to connect</p>
            <p className='my-2 w-2/3 text-center text-gray-500 text-xs mb-5'>
              Have your {walletName} wallet open and have 
              <a 
                href={
                  walletType === 'zelcore' ? 
                  'https://www.youtube.com/watch?v=Mv-UtypPsZ4&feature=youtu.be' : 
                  'https://kadena-io.github.io/kadena-docs/Chainweaver-Support/'
                }
                className='text-cb-pink ml-1 underline'
              >
                {walletName} Server turned on.
              </a>
            </p>
            { !wallet.keyList || wallet.keyList.length === 0 ? (
              <div className='w-full px-4 flex flex-col items-center mb-6'>
                <div className='relative w-full mx-auto'>
                  <input
                    placeholder='Enter your address'
                    className='w-full border border-gray-500 px-4 py-1 rounded text-sm'
                    value={localAddress}
                    onChange={ (e) => setLocalAddress(e.target.value) }
                  />
                  <div
                    data-role='clear input'
                    className='absolute top-0 -right-8 text-gray-300 h-full flex items-center hover:text-pink-500 cursor-pointer'
                    onClick={ () => setLocalAddress('') }
                  >
                    <FontAwesomeIcon icon={fa.faTimes} />
                  </div>
                </div>
                { walletType === 'chainweaver' || localAddress ? (
                    <button
                      type='button'
                      className='border border-gray-500 px-8 py-1.5 my-5 rounded'
                      onClick={ () => clickConnect('input') }
                    >
                      Connect
                    </button>
                  ) : (
                    <button
                      type='button'
                      className='border border-gray-500 px-8 py-1.5 my-5 rounded'
                      onClick={ () => clickFetchAccounts() }
                    >
                      Get accounts from {walletName}
                    </button>
                  )
                }
              </div>
              ) : (
              <div className='w-full px-4 flex flex-col items-center mb-6'>
                <div className='relative w-full mx-auto'>
                  <select
                    className='w-full border border-gray-500 px-2 py-1 rounded text-sm'
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
                  <div className='absolute top-0 right-2 mx-2 text-gray-300 h-full flex items-center'>
                    <FontAwesomeIcon icon={fa.faCaretDown} />
                  </div>
                  <div
                    data-role='clear input'
                    className='absolute top-0 -right-8 text-gray-300 h-full flex items-center hover:text-pink-500 cursor-pointer'
                    onClick={ () => setAddressList([]) }
                  >
                    <FontAwesomeIcon icon={fa.faTimes} />
                  </div>
                </div>
                <button
                  type='button'
                  className='border border-gray-500 px-8 py-1.5 my-5 rounded'
                  onClick={ () => clickConnect('select') }
                >
                  Connect
                </button>
              </div>
              )
            }
            <button 
              className='wallet-tab relative' 
              onClick={ () => setWalletType('') }
              onMouseEnter={ () => setMouseOverBack(true) }
              onMouseLeave={ () => setMouseOverBack(false) }
            >
              {walletName}
              <img src={`/img/${walletType}.png`} className='h-full rounded-xl' alt={walletName} />
              {mouseOverBack && 
                <div className='absolute top-0 left-0 px-1 w-full h-full z-20'>
                  <div className='w-full h-full bg-white bg-opacity-80 flex items-center justify-center space-x-2'>
                    <FontAwesomeIcon icon={fa.faCaretLeft} />
                    <span>Back to Wallet Selection</span>
                  </div>
                </div>
              }
            </button>
          </div>
        }
      </div>
    </div>
  ) : 
  <></>
  ;
};

Wallet.propTypes = {
  wallet: PropTypes.object.isRequired,
  switchWalletModal: PropTypes.func.isRequired,
  setAddressList: PropTypes.func.isRequired,
  setAccountAddress: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  wallet: state.wallet
});

const mapDispatchToProps = dispatch => ({
  switchWalletModal: () => dispatch(actions.switchWalletModal()),
  setAddressList: (keyList) => dispatch(actions.setAddressList(keyList)),
  setAccountAddress: (address) => dispatch(actions.setAccountAddress(address))
});

export default connect(mapStateToProps, mapDispatchToProps)(Wallet);
