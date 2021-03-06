import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { serverUrl } from '../../config';
import { ReactComponent as Twitter } from '../../assets/twitter.svg';
import { ReactComponent as Github } from '../../assets/github.svg';
import { ReactComponent as Telegram } from '../../assets/telegram.svg';

export const Footer = (props) => {

  const [itemCnt, setItemCnt] = useState(null);

  useEffect(() => {
    const fetchItemCnt = async () => {
      const { onLoading, onLoaded } = props;
      onLoading();
      const url = `${serverUrl}/item/count`;
      const data = await fetch(url)
        .then(res => res.json())
        .catch(error => console.log(error));
      
      if (data) {
        setItemCnt(data.count);
      } else {
        setItemCnt('');
      }
      onLoaded();
    };

    fetchItemCnt();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div data-role='footer container' className='text-sm'>
      <div data-role='footer nav' className='w-5/6 mx-auto pt-20 flex justify-between border-t'>
        <ul className='space-y-3 text-gray-500'>
          <li className='hover:text-black'><a href='/market/items'>Explore</a></li>
          <li className='hover:text-black'><a href='/create'>Create</a></li>
          <li className='hover:text-black'><a href='/user'>My Account</a></li>
        </ul>
        <ul className='space-y-3 text-gray-500 text-right'>
          <li className='hover:text-black'><a href='https://colorblock.zendesk.com/hc/en-us/sections/900002116083-FAQ'>FAQ</a></li>
          <li className='hover:text-black'><a href='https://colorblock.zendesk.com/hc'>Help</a></li>
          <li className='hover:text-black'><a href='/contact'>Contact</a></li>
        </ul>
      </div>
      <div data-role='footer info' className='w-5/6 mx-auto mt-20 mb-20 flex justify-between items-end'>
        <div className='w-1/3 text-gray-500 text-xs'>
          Colorblock | All Rights Reserved
        </div>
        <div className='w-1/3 text-gray-500 text-center flex flex-col justify-center items-center'>
          <img src='/img/colorblock_gray_logo.svg' className='w-12 h-12' alt='logo-gray' />
          { itemCnt && <p className='text-xs'>{('000' + itemCnt).slice(-3)} nfts minted</p> }
        </div>
        <div data-role='footer social links' className='w-1/3 flex justify-end items-center space-x-3'>
          <a href='https://twitter.com/ColorblockLabs' className='w-5 h-5 flex items-center'><Twitter fill='#8a8787' /></a>
          <a href='https://github.com/colorblock/Colorblock' className='w-5 h-5 flex items-center'><Github className='github' fill='#8a8787' /></a>
          <a href='https://t.me/colorblockart' className='w-5 h-5 flex items-center'><Telegram fill='#8a8787' /></a>
        </div>
      </div>
    </div>
  );
};

Footer.propTypes = {
  onLoaded: PropTypes.func.isRequired,
  onLoading: PropTypes.func.isRequired
};

const mapStateToProps = state => state;

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Footer);
