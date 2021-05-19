import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { switchWalletModal } from '../../store/actions/actionCreator';

const Header = (props) => {
  const { wallet, switchWalletModal } = props;

  return (
    <div className='flex mx-6 mb-2 py-2 border-b justify-between text-xs'>
      <div className='font-bold text-base px-2 flex-none h-full'>
        COLORBLOCK
      </div>
      <div className='pl-10 flex'>
        <input
          className='border w-96 h-full px-3 text-xs placeholder-gray-500 placeholder-opacity-25'
          placeholder='Search collectibles, and stuff...'
        />
        <ul className='flex w-52 justify-between py-1 ml-4'>
          <li>Explore</li>
          <li>Collections</li>
          <li>Categories</li>
        </ul>
      </div>
      <div>
        <ul className='flex justify-between'>
          <li>
            <img className='w-6 h-6' src='/img/moon.png' alt='Moon' />
          </li>
          <li>
            <button
              className='rounded border border-black bg-black text-white py-0.5 w-20 ml-2'
            >
              <a href='/create'>Create</a>
            </button>
          </li>
          <li>
            <button
              className='rounded border border-black py-0.5 w-20 ml-2'
              onClick={ () => switchWalletModal() }
            >
              { wallet.address ?
                `${wallet.address.slice(0, 3)}**${wallet.address.slice(-4)}` :
                'Connect'
              }
            </button>
          </li>
        </ul>
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

