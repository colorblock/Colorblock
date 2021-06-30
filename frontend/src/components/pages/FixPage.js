import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { toast } from 'react-toastify';
import { serverUrl } from '../../config';
import { mkReq } from '../../utils/sign';
import { showLoading, hideLoading } from '../../store/actions/actionCreator';

export const FixPage = (props) => {

  const [fixData, setFixData] = useState({});
  const [resultMsg, setResultMsg] = useState('');

  const { showLoading, hideLoading } = props;

  const clickFix = async () => {
    const postData = fixData;
    showLoading();
    const url = `${serverUrl}/asset/fix`;
    const result = await fetch(url, mkReq(postData))
      .then(res => res.json())
      .catch(error => {
        console.log(error);
        toast.error(error.message);
      });

    if (result && result.status === 'success') {
      const resultMsg = result.data;
      setResultMsg(JSON.stringify(resultMsg));
      toast.success('fix successfully');
    } else {
      toast.success(result.data);
    }
    hideLoading();
  };

  return (
    <div className='w-1/3 py-12 mx-auto'>
      <div className='text-center flex flex-col space-y-5'>
        <p>Asset Fixing Tool</p>
        <p className='text-gray-500 text-sm mt-3 mb-2'>You can specify one of your item or leave blank to fix all your items</p>
        <input 
          className='w-full px-3 py-1 border rounded text-sm' placeholder='Item ID:'
          type='text' 
          onChange={ (e) => setFixData({...fixData, itemId: e.target.value }) }  
        />
        <button className='w-full py-1 bg-cb-pink border rounded text-white mt-5' onClick={ () => clickFix() }>
          Start fix
        </button>
        <p className='text-gray-500 text-sm mt-3 mb-2'>{resultMsg}</p>
      </div>
    </div>
  );
};

FixPage.propTypes = {
  props: PropTypes
};

const mapStateToProps = (state) => ({
  
});

const mapDispatchToProps = dispatch => ({
  showLoading: (text=null) => dispatch(showLoading(text)),
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(FixPage);
