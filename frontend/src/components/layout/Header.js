import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

import { switchWalletModal, setWallet, createBaseMsg } from '../../store/actions/actionCreator';
import * as types from '../../store/actions/actionTypes';
import { serverUrl } from '../../config';
import { mkReq } from '../../utils/sign';


const Header = (props) => {
  const { wallet, switchWalletModal, setWallet } = props;
  const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);
  const userPopupEl = useRef(null);

  const onSearch = (e) => {
    const value = e.target.value;
    if (e.keyCode === 13 && value) {
      // if enter pressed and value is not blank, turn to search page
      const url = '/search/' + value;
      document.location.href = url;
    }
  };

  const myProfile = () => {
    setIsUserPopupOpen(false);
    document.location.href = '/user';
  };

  const switchAccount = () => {
    setIsUserPopupOpen(false);
    switchWalletModal();
  };

  const clickLogout = async () => {
    const msg = createBaseMsg();
    window.postMessage({
      ...msg,
      action: types.LOCK_ACCOUNT,
      context: 'header'
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
    const handleClickOutside = (e) => {    
      if (!userPopupEl.current || !userPopupEl.current.contains(e.target)) {
        setIsUserPopupOpen(false);
      }
    };
    const clickOutsideHandler = () => {
      // add click outside handler
      document.addEventListener('mousedown', handleClickOutside);
    };

    const setupWindow = () => {
      window.addEventListener('message', handleMessage);
    };
    const handleMessage = (event) => {
      const data = event.data;
      const source = data.source || '';
      if (source.startsWith('colorful') && data.context === 'header') {
        if (data.action === types.GET_ACCOUNT) {
          if (data.status === 'success') {
            const wallet = data.data.wallets[0]; // default choose first wallet, TODO: add rotate check
            setWallet(wallet);

            const postData = {
              address: wallet.address,
              public_key: wallet.publicKey,
              sigs: data.data.sigs[0]
            };
            const url = `${serverUrl}/login`;
            fetch(url, mkReq(postData));

          } else {
            console.log('get account error', data.data);
            logout();
          }
        } else if (data.action === types.LOCK_ACCOUNT) {
          if (data.status === 'success') {
            toast.success('Logout successfully');
          } else {
            toast.error(data.data);
          }
          logout();
          setIsUserPopupOpen(false);
        }
      }
    };
    const getAccountInfo = () => {
      const msg = createBaseMsg();
      window.postMessage({
        ...msg,
        action: types.GET_ACCOUNT,
        context: 'header'
      });
    };

    clickOutsideHandler();
    setupWindow();
    getAccountInfo();

    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('message', handleMessage);
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div data-role='header page'>
      <div data-role='non-fixed part taking space' className='h-16'>
      </div>
      <div data-role='fixed header' className='w-full h-16 fixed top-0 left-0 px-12 bg-white z-50 text-sm'>
        <div data-role='fixed header container' className='h-full flex justify-between border-b border-gray-200'>
          <div data-role='left flex part' className='h-full flex'>
            <div data-role='logo' className='mx-5 h-full py-3'>
              <a href='/'><img src='/img/colorblock_logo.svg' className='h-full' alt='logo' /></a>
            </div>
            <div data-role='search bar' className='w-120 my-3 flex items-center bg-gray-50 border rounded-lg border-white hover-pink'>
              <div className='mx-2 text-gray-300'>
                <FontAwesomeIcon icon={fa.faSearch} />
              </div>
              <input
                className='w-full px-0.5 bg-gray-50 placeholder-gray-400 placeholder-opacity-75'
                placeholder='Search collections, collectibles, and artists'
                onKeyUp={ (e) => onSearch(e) }
              />
            </div>
            <div data-role='nav bar' className='ml-7'>
              <ul className='h-full flex items-center space-x-7'>
                <li><a href='/market/assets'>Market</a></li>
                <li><a href='/market/collections'>Collections</a></li>
                <li><a href='/create'>Create</a></li>
                <li><a href='/market/items'>Token</a></li>
              </ul>
            </div>
          </div>
          <div data-role='right flex part' className='flex items-center'>
            <div className='relative w-24'>
              <button
                className='w-full py-2 bg-cb-pink border rounded-lg border-white text-white'
                onClick={ () => wallet.address ? setIsUserPopupOpen(!isUserPopupOpen) : switchWalletModal() }
              >
                { wallet.address ?
                  `${wallet.address.slice(0, 3)}**${wallet.address.slice(-4)}` :
                  'Connect'
                }
              </button>
              {
                isUserPopupOpen && 
                <div 
                  className='absolute top-0 left-0 mt-12 w-24 flex flex-col border rounded bg-white text-sm'
                  ref={userPopupEl}
                >
                  <button className='w-full py-2 border-b' onClick={ () => myProfile() }>My Profile</button>
                  <button className='w-full py-2 border-b' onClick={ () => switchAccount() }>Switch User</button>
                  <button className='w-full py-2' onClick={ () => clickLogout() }>logout</button>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Header.propTypes = {
  wallet: PropTypes.object.isRequired,
  switchWalletModal: PropTypes.func.isRequired,
  setAccountAddress: PropTypes.func.isRequired,
  onLoaded: PropTypes.func.isRequired,
  onLoading: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  wallet: state.wallet
});

const mapDispatchToProps = dispatch => ({
  switchWalletModal: () => dispatch(switchWalletModal()),
  setWallet: (wallet) => dispatch(setWallet(wallet))
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);

