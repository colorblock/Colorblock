import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

export const Footer = (props) => {
  return (
    <div data-role='footer container' className='text-sm'>
      <div data-role='footer nav' className='w-5/6 mx-auto mt-40 flex justify-between'>
        <ul className='space-y-3 text-gray-500'>
          <li className='hover:text-black'><a href='/market'>Explore</a></li>
          <li className='hover:text-black'><a href='/create'>Create</a></li>
          <li className='hover:text-black'><a href='/user'>My Account</a></li>
        </ul>
        <ul className='space-y-3 text-gray-500 text-right'>
          <li className='hover:text-black'>FAQ</li>
          <li className='hover:text-black'>Help</li>
          <li className='hover:text-black'>Contact</li>
        </ul>
      </div>
      <div data-role='footer info' className='w-5/6 mx-auto mt-20 mb-20 flex justify-between items-end'>
        <div className='w-1/3 text-gray-500 text-xs'>
          Colorblock | All Rights Reserved
        </div>
        <div className='w-1/3 text-gray-500 text-center flex flex-col justify-center items-center'>
          <img src='/img/colorblock_gray_logo.svg' className='w-12 h-12' alt='logo-gray' />
          <p className='text-xs'>002 nfts minted</p>
        </div>
        <div className='w-1/3 flex justify-end space-x-3'>
          <img src='/img/twitter.svg' className='w-4 h-4' alt='twitter' />
          <img src='/img/github.svg' className='w-4 h-4' alt='github' />
          <img src='/img/telegram.svg' className='w-4 h-4' alt='telegram' />
        </div>
      </div>
    </div>
  );
};

Footer.propTypes = {
};

const mapStateToProps = (state) => ({
  
});

const mapDispatchToProps = {
  
};

export default connect(mapStateToProps, mapDispatchToProps)(Footer);
