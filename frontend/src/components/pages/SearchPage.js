import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { toast } from 'react-toastify';

import ItemList from '../common/ItemList';
import UserList from '../common/UserList';
import { serverUrl } from '../../config';
import { showLoading, hideLoading } from '../../store/actions/actionCreator';

export const SearchPage = (props) => {
  
  const { keyword } = useParams();
  const { loading, showLoading, hideLoading } = props;
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [tabType, setTabType] = useState('item');

  useEffect(() => {
    const fetchSearchResults = async () => {
      showLoading();

      const url = `${serverUrl}/search/${keyword}`;
      console.log(url);
      const data = await fetch(url)
        .then(res => res.json())
        .catch(error => {
          console.log(error);
          toast.error(error.message);
        });

      console.log(data);
      if (data) {
        setItems(data.items);
        setUsers(data.users);
      }

      hideLoading();
    };

    fetchSearchResults();
  }, [keyword, showLoading, hideLoading]);

  return loading ? <></> : (
    <div data-role='market container' className='bg-cb-gray text-sm'>
      <div data-role='result tabs' className='mx-auto my-10 pb-3 flex justify-center space-x-20 text-lg border-b'>
        <button className='px-5 py-2 hover:bg-gray-300' onClick={ () => setTabType('item') }>Item({items.length})</button>
        <button className='px-5 py-2 hover:bg-gray-300' onClick={ () => setTabType('user') }>User({users.length})</button>
      </div>
      <div data-role='result presentaion'>
        {
          tabType === 'item' && (
            <div data-role='items container' className=''>
              {
                items.length > 0 ? <ItemList items={items} display='grid' /> : <>No items</>
              }
            </div>
          )
        }
        {
          tabType === 'user' && (
            <div data-role='users container' className=''>
              {
                users.length > 0 ? <UserList users={users} display='grid' /> : <>No users</>
              }
            </div>
          )
        }
      </div>
    </div>
  );
};

SearchPage.propTypes = {
  loading: PropTypes.bool.isRequired,
  showLoading: PropTypes.func.isRequired,
  hideLoading: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  loading: state.root.loading
});

const mapDispatchToProps = dispatch => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(SearchPage);
