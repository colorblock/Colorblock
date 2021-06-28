import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

import { switchWalletModal, setWallet, createBaseMsg } from '../../store/actions/actionCreator';
import { capitalize } from '../../utils/polish';
import * as types from '../../store/actions/actionTypes';
import { mkReq } from '../../utils/sign';
import { serverUrl } from '../../config';

export const Wallet = (props) => {
  const { wallet, switchWalletModal, setWallet } = props;
  const [walletType, setWalletType] = useState('');
  const [mouseOverBack, setMouseOverBack] = useState(false);

  const walletName = capitalize(walletType);

  const clickConnect = () => {
    const msg = createBaseMsg();
    window.postMessage({
      ...msg,
      action: types.GET_ACCOUNT,
      context: 'walletModal'
    });
  };

  const logout = () => {
    setWallet({
      'address': '',
      'publicKey': ''
    });
            
    const url = `${serverUrl}/logout`;
    fetch(url, mkReq());
  };

  useEffect(() => {
    const setupWindow = () => {
      window.addEventListener('message', handleMessage);
    };
    const handleMessage = (event) => {
      const data = event.data;
      const source = data.source || '';
      if (source.startsWith('colorful') && data.context === 'walletModal' && data.action === types.GET_ACCOUNT) {
        console.log('in handle message in walletModal get account', data);
        if (data.status === 'success') {
          const wallet = data.data.wallets[0]; // default choose first wallet
          setWallet(wallet);
          switchWalletModal();
          toast.success('Connect successfully');

          const postData = {
            address: wallet.address,
            public_key: wallet.publicKey,
            sigs: data.data.sigs[0]
          };
          const url = `${serverUrl}/login`;
          fetch(url, mkReq(postData));

        } else {
          toast.error(data.data);
          logout();
        }
      }
    };

    setupWindow();

    return () => {
      // Unbind the event listener on clean up
      window.removeEventListener('message', handleMessage);
    };
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
            <button className='wallet-tab' onClick={ () => setWalletType('colorful') }>
              Colorful
              <img src='/img/colorful.png' className='h-full rounded-xl' alt='colorful' />
            </button>
            <button className='wallet-tab focus:ring focus:ring-gray-500' onClick={ () => toast.warning('Zelcore is not supported yet') }>
              Zelcore
              <img src='/img/zelcore.png' className='h-full rounded-xl' alt='zelcore' />
            </button>
            <button className='wallet-tab focus:ring focus:ring-gray-500' onClick={ () => toast.warning('Chainweaver is not supported yet') }>
              Chainweaver
              <img src='/img/chainweaver.png' className='h-full rounded-xl' alt='chainweaver' />
            </button>
            <button className='wallet-tab focus:ring focus:ring-gray-500' onClick={ () => toast.warning('Torus is not supported yet') }>
              Torus
              <img src='/img/torus.png' className='h-full rounded-xl' alt='torus' />
            </button>
            <div className='mt-16 mb-5 mx-10 text-center text-xs'>
              New to Kadena?
              <a target='_blank' rel='noopener noreferrer' href='https://www.kadena.io/chainweaver' className='text-cb-pink ml-1 underline'>
                Learn more about wallets
              </a>
            </div>
          </div>
        }
        { walletType &&
          <div className='flex flex-col items-center justify-center px-5 font-base text-sm pb-5'>
            <p className='font-semibold text-left mb-2'>Follow instructions to connect</p>
            <p className='my-2 w-2/3 text-left text-gray-500 text-xs mb-1'>
              1. Download Colorful wallet chrome extension (build zip).
              <a  
                target='_blank' rel='noopener noreferrer' 
                href='https://static.colorblock.art/build.zip'
                className='text-cb-pink ml-1 underline'
              >Link</a>
            </p>
            <p className='my-2 w-2/3 text-left text-gray-500 text-xs mb-1'>
              2. Open chrome extension page and <span className='font-bold'>open dev mode.</span>
              <a 
                target='_blank' rel='noopener noreferrer' 
                href='chrome://extensions'
                className='text-cb-pink ml-1 underline'
              >chrome://extensions</a>
            </p>
            <p className='my-2 w-2/3 text-left text-gray-500 text-xs mb-1'>
              3. Load unpacked app.
            </p>
            <p className='my-2 w-2/3 text-left text-gray-500 text-xs mb-1'>
              4. Add Colorful to Popup list.
            </p>
            <p className='my-2 w-2/3 text-left text-gray-500 text-xs mb-1'>
              5. Finish intialization.
            </p>
            <button className='w-full py-2 bg-cb-pink border rounded-lg border-white text-white mt-8 mb-4' onClick={ () => clickConnect() }>Let's go</button>
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
  switchWalletModal: () => dispatch(switchWalletModal()),
  setWallet: (wallet) => dispatch(setWallet(wallet))
});

export default connect(mapStateToProps, mapDispatchToProps)(Wallet);
