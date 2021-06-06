import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';

import { serverUrl } from '../../config';
import { mkReq } from '../../utils/sign';
import { switchWalletModal, setAccountAddress } from '../../store/actions/actionCreator';

const Header = (props) => {
  const { wallet, switchWalletModal, setAccountAddress } = props;
  const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);

  const onSearch = (e) => {
    const value = e.target.value;
    if (e.keyCode === 13 && value) {
      // if enter pressed and value is not blank, turn to search page
      const url = '/search/' + value;
      document.location.href = url;
    }
  };

  const logout = async () => {
    setAccountAddress('');
    const url = `${serverUrl}/logout`;
    const result = await fetch(url, mkReq()).then(res => res.json());
    if (result.status === 'success') {
      alert('logout successfully');
    } else {
      alert(result.data);
    }
  };

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
                <li><a href='/market'>Market</a></li>
                <li><a href='/market'>Collections</a></li>
                <li><a href='/create'>Create</a></li>
                <li><a href='/market'>Token</a></li>
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
                <div className='absolute top-10 left-0 w-24 flex flex-col border rounded bg-white'>
                  <button className='w-full py-2 border-b' onClick={ () => document.location.href = '/user' }>My Profile</button>
                  <button className='w-full py-2' onClick={ () => logout() }>logout</button>
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
  wallet: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  wallet: state.wallet
});

const mapDispatchToProps = dispatch => ({
  switchWalletModal: () => dispatch(switchWalletModal()),
  setAccountAddress: (address) => dispatch(setAccountAddress(address))
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);

