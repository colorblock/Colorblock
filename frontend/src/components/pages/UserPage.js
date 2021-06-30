import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { toast } from 'react-toastify';

import { shortAddress } from '../../utils/polish';
import { withCors } from '../../utils/sign';
import ItemList from '../common/ItemList';
import { serverUrl } from '../../config';
import { showLoading, hideLoading } from '../../store/actions/actionCreator';

const UserPage = (props) => {

  const { userId } = useParams();
  const { loading, showLoading, hideLoading, wallet } = props;
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchData = async (userId) => {
      showLoading();

      await Promise.all([
        fetchUser(userId),
        fetchAssets(userId)
      ]);

      hideLoading();
    };

    const fetchUser = async (userId) => {
      let userData;
      if (userId) {
        const url = `${serverUrl}/user/${userId}`;
        userData = await fetch(url)
          .then(res => res.json())
          .catch(error => {
            console.log(error);
            toast.error(error.message);
          });
      } else {
        const url = `${serverUrl}/user`;
        userData = await fetch(url, withCors)
          .then(res => res.json())
          .catch(error => {
            console.log(error);
            toast.error(error.message);
          });

        if (userData && userData.status === 'error') {
          toast.error('Please login first');
          setTimeout(() => document.location.href = '/', 2000);
          return;
        }
      }

      if (userData) {
        userData.avatar = userData.avatar || '/img/colorblock_logo.svg';
        userData.uname = userData.uname || shortAddress(userData.address);
        setUser(userData);
      }
    };

    const fetchAssets = async (userId) => {
      // fetch assets
      const assetsUrl = `${serverUrl}/asset/owned-by/${userId || wallet.address }`;
      const assetsData = await fetch(assetsUrl).then(res => res.json());
      const items = assetsData.map(asset => asset.item);
      setItems(items);
    };

    fetchData(userId);
  }, [userId, showLoading, hideLoading, wallet]);

  return !user || loading ? <></> : (
    <div className='pb-20'>
      <div data-role='user info' className='my-8 flex flex-col items-center justify-center'>
        <img 
          src={user.avatar} 
          className='w-12 border rounded-full m-4'
          alt={user.uname}
        />
        <p>{user.uname}</p>
        <p className='py-2 text-xs text-gray-400'>{user.address}</p>
      </div>
      {
        items.length > 0 ? (
          <div data-role='item list'>
            <ItemList items={items} display='grid' />
          </div>
        ) : (
          <div>
            No assets
          </div>
        )
      }
    </div>
  );
};

UserPage.propTypes = {
  loading: PropTypes.bool.isRequired,
  showLoading: PropTypes.func.isRequired,
  hideLoading: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  wallet: state.wallet,
  loading: state.root.loading
});

const mapDispatchToProps = dispatch => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(UserPage);

