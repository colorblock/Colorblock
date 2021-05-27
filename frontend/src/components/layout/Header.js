import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';
import { switchWalletModal } from '../../store/actions/actionCreator';
const Header = (props) => {
  const { wallet, switchWalletModal } = props;

  return (
    <div data-role='header page' className='w-full bg-white text-sm'>
      <div data-role='non-fixed part taking space' className='h-16'>
      </div>
      <div data-role='fixed header' className='w-full h-16 fixed top-0 bg-white'>
        <div data-role='fixed header container' className='h-full flex justify-between mx-12 border-b border-gray-200'>
          <div data-role='left flex part' className='h-full flex'>
            <div data-role='logo' className='mx-5 h-full py-3'>
              <img src='/img/colorblock_logo.svg' className='h-full' alt='logo' />
            </div>
            <div data-role='search bar' className='w-120 my-3 flex items-center bg-gray-50 border rounded-lg border-white hover-pink'>
              <div className='mx-2 text-gray-300'>
                <FontAwesomeIcon icon={fa.faSearch} />
              </div>
              <input
                className='w-full px-0.5 bg-gray-50 placeholder-gray-400 placeholder-opacity-75'
                placeholder='Search collections, collectibles, and artists'
              />
            </div>
            <div data-role='nav bar' className='ml-5'>
              <ul className='h-full flex items-center space-x-5'>
                <li>Market</li>
                <li>Collections</li>
                <li>Create</li>
                <li>Token</li>
              </ul>
            </div>
          </div>
          <div data-role='right flex part' className='flex items-center space-x-5'>
            <span className='whitespace-nowrap'>My Profile</span>
            <img src='/img/profile_picture.svg' className='h-full py-3 mx-2' alt='profile' />
            <button
              className='py-2 px-4 bg-pink border rounded-lg border-white text-white'
              onClick={ () => switchWalletModal() }
            >
              { wallet.address ?
                `${wallet.address.slice(0, 3)}**${wallet.address.slice(-4)}` :
                'Connect'
              }
            </button>
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
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);

